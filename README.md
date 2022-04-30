# TODO

- remove express and replace with more native api gateway events
- user profile pictures with s3? would need to add new endpoint to CRUD avatar
- frontend in vue
  - pages:
    - /login
      - login or register
      - redirect to scanner
    - /profile
      - show books currently checked out
      - show check out history
      - change profile pic
      - change password
      - delete account
    - /scanner
      - scan isbn and check in/out book
    - /books
      - list books and check out status
      - add new book to library if user has librarian role
    - /admin
      - manage users and roles if user has admin role
