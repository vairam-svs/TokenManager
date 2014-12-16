Thinktecture IdentityServer v3 TokenManagerJS
=============================================

 JavaScript library for Thinktecture IdentityServer v3
 (based on OAuthJS sample [link](https://github.com/thinktecture/Thinktecture.IdentityServer.v3.Samples/commit/45d44a3e65e462271acfcfab58b8e713768d5d59))

## What changed since the last commit? ##

### Added the possiblity to change the implementation of XMLHttpRequest and the Promise polyfill ###

To get the library ready for using in AngularJS (which provides $http and $q), we needed a way to wrap those
calls to then use the Angular services instead.

### Included the scope information in TokenManager ###

As requested in issue [#38](https://github.com/thinktecture/Thinktecture.IdentityServer.v3.Samples/issues/38)
the scope information should be available on the TokenManager. This is now implemented as an array property 'scope'.

### Prefix the storage key in TokenManager ###

A new property 'persistKey' is available on the settings which could be provided during instantiation of
TokenManager. This defines the key used to read and write to the persistance store (see issue [#37](https://github.com/thinktecture/Thinktecture.IdentityServer.v3.Samples/issues/37))

### Callback when a silent token renew fails ###

In issue [#39](https://github.com/thinktecture/Thinktecture.IdentityServer.v3.Samples/issues/39) was a callback requested
which will be executed, when a silen token renew fails. This is now available on every instance of TokenManager
as 'addOnSilentTokenRenewFailed'.