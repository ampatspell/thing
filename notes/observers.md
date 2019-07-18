# Snapshot Observers

onSnapshot observers are added for:

* persisted-reference creates BasicDocumentObserver in constructor
* internal-query creates query type-specific observer in constructor

Plan is to:

* register queries as opaque sources in documents
* unregister queries from documents on query destroy

Observer has `create`, `update` and `destroy` delegate functions. those can be used to register and unregister.

Context is expected to be semi-short-lived, so when query is destroyed, it should be fine to add basic document observer for doc.

At the moment context destroys queries and only then identity -> models -> documents. It should start with identity so that document can add observer only if it is not isDestroying.

Queries are recreated on dependency change. How this affects register-unregister stuff?

## TODO

Clean up document deserialization:

* internal-document didLoad
* documents-manager loadedInternalDocumentForSnapshot
