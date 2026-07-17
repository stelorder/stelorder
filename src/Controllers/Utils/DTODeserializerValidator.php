<?php
/**
 * phpcs:disable WordPress.Security.EscapeOutput.ExceptionNotEscaped
 */

namespace Stel\Verifactu\Controllers\Utils;

use InvalidArgumentException;
use Stel\Verifactu\Vendor\Symfony\Component\PropertyInfo\Extractor\PhpDocExtractor;
use Stel\Verifactu\Vendor\Symfony\Component\PropertyInfo\Extractor\ReflectionExtractor;
use Stel\Verifactu\Vendor\Symfony\Component\PropertyInfo\PropertyInfoExtractor;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Encoder\JsonEncoder;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Exception\NotNormalizableValueException;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\NameConverter\MetadataAwareNameConverter;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Normalizer\ArrayDenormalizer;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Serializer;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Validation;
use Stel\Verifactu\Vendor\Symfony\Component\Validator\Validator\ValidatorInterface;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Mapping\Factory\ClassMetadataFactory;
use Stel\Verifactu\Vendor\Symfony\Component\Serializer\Mapping\Loader\AttributeLoader;

class DTODeserializerValidator {

    private Serializer $serializer;
    private ValidatorInterface $validator;
    private static ?DTODeserializerValidator $instance = null;

    public static function getInstance(): DTODeserializerValidator {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Extractor de tipos para que el normalizador sepa castear cada propiedad
        $propertyInfo = new PropertyInfoExtractor(
            [new ReflectionExtractor()],  // listExtractors, lee el constructor y los getters/setters para descubrir propiedades
            [new PhpDocExtractor(), new ReflectionExtractor()],  // typeExtractors, lee los tipos de las propiedades a través de PHPDoc o reflexión (tipos nativos)
        );

        $classMetadataFactory = new ClassMetadataFactory(new AttributeLoader());

        // Inicializamos el conversor de nombres capaz de leer los atributos #[SerializedName]
        $nameConverter = new MetadataAwareNameConverter($classMetadataFactory);

        $this->serializer = new Serializer(
            normalizers: [
                new ObjectNormalizer(
                    $classMetadataFactory,
                    $nameConverter,
                    null,
                    $propertyInfo
                ),
                new ArrayDenormalizer(),   // Permite deserializar arrays de objetos: Foo[]
            ],
            encoders: [new JsonEncoder()]
        );

        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->getValidator();
    }

    /**
     * Deserializa un array asociativo en una instancia de $class y la valida.
     *
     * @template T of object
     * @param array        $data
     * @param class-string<T> $class
     * @return T
     * @throws InvalidArgumentException con todos los errores de validación agrupados
     */
    public function deserializeAndValidate(array $data, string $class): object {
        $dto = null;
        try {
            $dto = $this->serializer->denormalize($data, $class);
            $this->validate($dto);
            return $dto;
        } catch (NotNormalizableValueException $e) {
            // Captura el error de tipo del serializador y lo lanza como Argumento Inválido
            throw new InvalidArgumentException(sprintf(
                'Invalid type for path "[%s]". Expected "%s", but got "%s".',
                $e->getPath(),
                implode('|', $e->getExpectedTypes() ?? []),
                $e->getCurrentType()
            ));
        }
    }

    /**
     * Deserializa un array de arrays asociativos en un array de instancias de $class.
     *
     * @template T of object
     * @param array[]      $items
     * @param class-string<T> $class
     * @return T[]
     * @throws InvalidArgumentException con todos los errores agrupados por índice
     */
    public function deserializeAndValidateAll(array $items, string $class): array {
        $errors = [];
        $dtos   = [];

        foreach ($items as $index => $item) {
            try {
                $dtos[] = $this->deserializeAndValidate($item, $class);
            } catch (InvalidArgumentException $e) {
                $errors["[$index]"] = $e->getMessage();
            }
        }

        if (!empty($errors)) {
            $messages = array_map(
                fn($index, $msg) => "{$index} {$msg}",
                array_keys($errors),
                $errors
            );
            throw new InvalidArgumentException(implode(' | ', $messages));
        }

        return $dtos;
    }

    private function validate(object $dto): void {
        $violations = $this->validator->validate($dto);

        if (count($violations) === 0) return;

        $messages = array_map(
            fn($v) => "[{$v->getPropertyPath()}] {$v->getMessage()}",
            iterator_to_array($violations)
        );

        throw new InvalidArgumentException(implode('; ', $messages));
    }
}