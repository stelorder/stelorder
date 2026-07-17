<?php

namespace Stel\Verifactu\Services\Utils;

class ErrorMessages {
    public const INVALID_RECORD = 'Each record must be a string and have only minuscule letters and _: ';
    public const INVALID_PLATFORM_ID = 'Platform ID must not be empty and must be a valid UUID.';
    public const INVALID_INTEGRATION_ID = 'Integration ID must not be empty and must be a valid UUID.';
    public const INVALID_ENTITY = 'Entity must not be empty and must be a string.';
    public const INVALID_ENTITY_ARRAY = 'Entities must be an array not empty .';
    public const INVALID_RECORDS = 'Records must not be empty.';
    public const INVALID_CONSUMER_KEY = 'Consumer Key must not be empty and must be a string.';
    public const INVALID_CONSUMER_SECRET = 'Consumer Secret must not be empty and must be a string.';
    public const INTEGRATION_NOT_FOUND = 'The integration does not exist.';
    public const INTEGRATION_CREATION_ERROR = 'There was an error while trying to create the integration.';
    public const INTEGRATION_GET_ERROR = 'There was an error while trying to get the integration.';
    public const WEBHOOK_CREATION_ERROR = 'There was an error while trying to create the webhook.';
    public const WEBHOOK_GET_ERROR = 'There was an error while trying to get the webhooks.';
    public const WEBHOOK_UPDATE_ERROR = 'There was an error while trying to update the webhook.';
    public const WEBHOOK_DELETION_ERROR = 'There was an error while trying to delete the webhooks.';
    public const INVALID_SUBSCRIBER_ID = 'The subscriber ID must be a valid UUID';
}