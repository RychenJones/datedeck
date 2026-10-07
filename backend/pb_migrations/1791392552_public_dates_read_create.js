/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("dates")

  collection.listRule = ""
  collection.viewRule = ""
  collection.createRule = ""

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("dates")

  collection.listRule = null
  collection.viewRule = null
  collection.createRule = null

  return app.save(collection)
})
