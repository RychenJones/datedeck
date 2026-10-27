/// <reference path="../pb_data/types.d.ts" />
// DD-10: only signed-in users add ideas, credited to themselves; only the creator edits or removes theirs.
migrate((app) => {
  const dates = app.findCollectionByNameOrId("dates")

  dates.createRule = '@request.auth.id != "" && @request.body.created_by = @request.auth.id'
  dates.updateRule = '@request.auth.id != "" && created_by = @request.auth.id && (@request.body.created_by:isset = false || @request.body.created_by = @request.auth.id)'
  dates.deleteRule = '@request.auth.id != "" && created_by = @request.auth.id'
  app.save(dates)

  // People sign in with their email, so every account needs one.
  const users = app.findCollectionByNameOrId("_pb_users_auth_")
  users.fields.getByName("email").required = true

  return app.save(users)
}, (app) => {
  const dates = app.findCollectionByNameOrId("dates")

  dates.createRule = ""
  dates.updateRule = null
  dates.deleteRule = null
  app.save(dates)

  const users = app.findCollectionByNameOrId("_pb_users_auth_")
  users.fields.getByName("email").required = false

  return app.save(users)
})
