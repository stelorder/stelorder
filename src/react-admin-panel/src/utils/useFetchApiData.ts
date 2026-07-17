import { useWpApiSettings } from "../hooks/useWpApiSettings";

export function useFetchApiData<T>(): {
  fetchData: (data: {
    endpoint: string;
    method?: string;
    body?: Record<string, unknown>;
  }) => Promise<T>;
} {
  const { nonce, rootUrl } = useWpApiSettings();
  return {
    fetchData: ({ endpoint, method = "GET", body }) =>
      fetch(rootUrl + endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          // El nonce será utilizado en la autenticación de la petición, además, cuando se envíe la solicitud,
          // se incluirá la cookie de autenticación de WordPress, por lo que no es necesario enviar 
          // el token de autenticación
          "X-WP-Nonce": nonce,
        },
        body: method !== "GET" ? JSON.stringify(body) : undefined,
      }).then(async (res) => {
        const payload = await res.json();
        if (res.ok) {
          return payload as T;
        }
        throw payload;
      }),
  };
}
