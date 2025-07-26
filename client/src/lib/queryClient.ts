import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Legacy XMLHttpRequest for better browser compatibility
function createXHR(): XMLHttpRequest {
  if (typeof XMLHttpRequest !== 'undefined') {
    return new XMLHttpRequest();
  }
  // Fallback for very old browsers
  try {
    return new (window as any).ActiveXObject('Microsoft.XMLHTTP');
  } catch (e) {
    throw new Error('XMLHttpRequest not supported');
  }
}

// XMLHttpRequest-based fetch replacement for legacy browsers
function legacyFetch(url: string, options: any = {}): Promise<any> {
  return new Promise(function(resolve, reject) {
    var xhr = createXHR();
    var method = options.method || 'GET';
    
    xhr.open(method, url, true);
    xhr.withCredentials = options.credentials === 'include';
    
    // Set headers
    if (options.headers) {
      for (var key in options.headers) {
        if (options.headers.hasOwnProperty(key)) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
    }
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        var response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          text: function() {
            return Promise.resolve(xhr.responseText);
          },
          json: function() {
            try {
              return Promise.resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              return Promise.reject(e);
            }
          }
        };
        
        if (response.ok) {
          resolve(response);
        } else {
          reject(new Error(xhr.status + ': ' + xhr.statusText));
        }
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
    
    xhr.send(options.body || null);
  });
}

// Use native fetch if available, fallback to XMLHttpRequest
var safeFetch = (typeof fetch !== 'undefined') ? fetch : legacyFetch;

function throwIfResNotOk(res: any) {
  return new Promise(function(resolve, reject) {
    if (!res.ok) {
      res.text().then(function(text: string) {
        reject(new Error(res.status + ': ' + (text || res.statusText)));
      });
    } else {
      resolve(res);
    }
  });
}

export function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  return new Promise(function(resolve, reject) {
    var options = {
      method: method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    };

    safeFetch(url, options)
      .then(function(res: any) {
        return throwIfResNotOk(res).then(function() {
          return res;
        });
      })
      .then(resolve)
      .catch(reject);
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  function({ queryKey }) {
    return new Promise(function(resolve, reject) {
      safeFetch(queryKey.join("/") as string, {
        credentials: "include",
      })
        .then(function(res: any) {
          if (unauthorizedBehavior === "returnNull" && res.status === 401) {
            resolve(null as any);
            return;
          }
          
          return throwIfResNotOk(res).then(function() {
            return res.json();
          });
        })
        .then(resolve)
        .catch(reject);
    });
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
