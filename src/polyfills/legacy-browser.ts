/**
 * Essential legacy browser support
 */

// Simple feature detection
console.log('[Polyfills] Initializing legacy browser support...');

// Mobile and touch detection
try {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice && document.documentElement.classList) {
    document.documentElement.classList.add('touch');
  }

  const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         window.innerWidth <= 768;
  if (isMobileDevice && document.documentElement.classList) {
    document.documentElement.classList.add('mobile');
  }

  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  if (isFirefox && document.documentElement.classList) {
    document.documentElement.classList.add('firefox');
  }
} catch (e) {
  console.warn('Feature detection failed:', e);
}

console.log('[Polyfills] Legacy browser support initialized');

// Array.from polyfill
if (!Array.from) {
  Array.from = function<T>(arrayLike: ArrayLike<T>): T[] {
    var result: T[] = [];
    for (var i = 0; i < arrayLike.length; i++) {
      result.push(arrayLike[i]);
    }
    return result;
  };
}

// String.startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString: string, position?: number): boolean {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// String.endsWith polyfill
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString: string, length?: number): boolean {
    if (typeof length === 'undefined' || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };
}

// Promise polyfill (basic implementation)
if (typeof Promise === 'undefined') {
  (window as any).Promise = function(executor: Function) {
    var self: any = this;
    self.state = 'pending';
    self.value = undefined;
    self.reason = undefined;
    self.callbacks = [];

    function resolve(value: any) {
      if (self.state === 'pending') {
        self.state = 'fulfilled';
        self.value = value;
        self.callbacks.forEach(function(callback: any) {
          callback.onFulfilled(value);
        });
      }
    }

    function reject(reason: any) {
      if (self.state === 'pending') {
        self.state = 'rejected';
        self.reason = reason;
        self.callbacks.forEach(function(callback: any) {
          callback.onRejected(reason);
        });
      }
    }

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  };

  (window as any).Promise.prototype.then = function(onFulfilled?: Function, onRejected?: Function) {
    var self: any = this;
    return new (window as any).Promise(function(resolve: Function, reject: Function) {
      function handle() {
        if (self.state === 'fulfilled') {
          if (typeof onFulfilled === 'function') {
            try {
              resolve(onFulfilled(self.value));
            } catch (error) {
              reject(error);
            }
          } else {
            resolve(self.value);
          }
        } else if (self.state === 'rejected') {
          if (typeof onRejected === 'function') {
            try {
              resolve(onRejected(self.reason));
            } catch (error) {
              reject(error);
            }
          } else {
            reject(self.reason);
          }
        }
      }

      if (self.state === 'pending') {
        self.callbacks.push({
          onFulfilled: function(value: any) {
            if (typeof onFulfilled === 'function') {
              try {
                resolve(onFulfilled(value));
              } catch (error) {
                reject(error);
              }
            } else {
              resolve(value);
            }
          },
          onRejected: function(reason: any) {
            if (typeof onRejected === 'function') {
              try {
                resolve(onRejected(reason));
              } catch (error) {
                reject(error);
              }
            } else {
              reject(reason);
            }
          }
        });
      } else {
        setTimeout(handle, 0);
      }
    });
  };

  (window as any).Promise.prototype.catch = function(onRejected: Function) {
    return this.then(null, onRejected);
  };
}

// RequestAnimationFrame polyfill
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback: FrameRequestCallback): number {
    return window.setTimeout(function() {
      callback(Date.now());
    }, 1000 / 60);
  };
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id: number): void {
    clearTimeout(id);
  };
}

// classList polyfill for older browsers
if (!('classList' in document.createElement('_'))) {
  (function(view: any) {
    if (!('Element' in view)) return;

    var classListProp = 'classList',
        protoProp = 'prototype',
        elemCtrProto = view.Element[protoProp],
        objCtr = Object,
        strTrim: (this: string) => string,
        arrIndexOf: (this: any[], item: any) => number;

    // Helper functions with proper types
    function legacyAddClass(element: HTMLElement, className: string): void {
      if (element.classList) {
        element.classList.add(className);
      } else {
        if (element.className.indexOf(className) === -1) {
          element.className += ' ' + className;
        }
      }
    }

    function legacyRemoveClass(element: HTMLElement, className: string): void {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        element.className = element.className.replace(new RegExp('\\b' + className + '\\b', 'g'), '');
      }
    }

    if (objCtr.defineProperty) {
      var defineProperty = {
        get: function() {
          return new DOMTokenList(this);
        }
      };
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, defineProperty);
      } catch (ex) {
        if (ex.number === -0x7FF5EC54) {
          defineProperty.enumerable = false;
          defineProperty.configurable = false;
          objCtr.defineProperty(elemCtrProto, classListProp, defineProperty);
        }
      }
    }
  }(window));
}

// Initialize touch detection
var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
if (isTouchDevice) {
  document.documentElement.classList.add('touch');
} else {
  document.documentElement.classList.add('no-touch');
}

// Mobile detection
var isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
if (isMobileDevice) {
  document.documentElement.classList.add('mobile');
} else {
  document.documentElement.classList.add('desktop');
}

// Firefox detection
var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
if (isFirefox) {
  document.documentElement.classList.add('firefox');
}

console.log('[Polyfills] Legacy browser support initialized');