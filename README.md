# express-online-shop-backend-mongodb-mongoose

## An Express file server for a simple online e-commerce store.

### This is a portfolio piece to show general programming, containerization, and deployment. So it is not a completely polished piece.

#### Tech Stack Used:

JavaScript
Node.js
Express.js
MongoDB
Mongoose ODM
Express-validator
Express-session
Connect-mongodb-session
Multer
Pdfkit
Cors
Docker
AWS ECR
AWS Secrets Manager
AWS App Runner
Nodemon
PM2

#### Features:

1. This project is a file server that is uses EJS templates to serve HTML, CSS, and image files to the client. It is architected in an MVC manner. There are CRUD endpoints supporting the different functionalities needed.
1. Sign up, Sign in, and logout functionality that uses sessions to determine whether a user is authenticated, or not.
1. Logged in users take on a mixed role of admin and normal shopping user. Acting as admins, users can add new products to the store. Acting as shopping users, users can add products to their cart, checkout, and receive a PDF invoice of their "purchase".
1. Acting as an admin user, the user can upload a title, price, description, and image for the product. These are then persisted in a MongoDB database. The image is stored in the file system with its path referenced in the database document. The admin user can also edit and delete products from the store if they were the one's that created the product in the first place.
1. Acting as a normal user, the user can view the products that have been uploaded to the stores. They can view details about the products. They can add, view and delete the products in/from their carts. They can also checkout once they are satisfied with their selection.
1. Once a user checkouts a simple PDF invoice is generated and a readstream is used to store that PDF in the file server. The user is then redirected to the order page where they can see a running list of their previous orders, as well as a link to their invoice for viewing and downloading.
1. Pagination is setup for viewing products, and the amount of products per page can be adjusted via an env variable. The products list pagination will show the first page, the last page, the previous page if it isn't the first page, and the next page if it isn't the last page.

#### More Technical Details:

1. Sign up and sign in auth endpoints, hashing of passwords for DB storage, session signing and verifying using express-session.
1. Express-validator used to validate auth endpoint requests.
1. Sessions are stored in the database using connect-mongodb-session library and they are verified via Express.js middleware.
1. Uses MongoDB leveraging Mongoose ODM with user, product, and order collections/models.
1. Routes, Controllers, Middleware, and Models directories.
1. Uses EJS to template HTML files to be rendered in the client's browser.
   Nodemon for development.
1. Uses multer library for handling incoming images and storing them in the file system
1. Uses pdfkit to create to programatically create a PDF and a readstream to send the file to both the file system and the client's browser.
1. UI has file picker for choosing the image to upload when adding a new product as an admin.
1. PM2 for production - clustering enababled with max of two instances since this is portfolio work only.
1. Nodemon for development refresh
1. dotenv library for environment variables.
1. Dockerfile for containerization.

#### Acknowleded Improvement Possibilites

Since this is a portfolio piece, there is room for improvement on making this truly production level. I'll list some of them below so that you know I understand them.

1. Image storage - I'm currently using the file system to store images when an admin creates a post. This is not a production sustainable solution. Would be better to create an AWS s3 bucket for the images, and then use the Product collection to store a URL to reference the image in a more maintable way.
1. async/await - I'm using then/catch here. Not a big deal, but converting to async/await would make for a more readable codebase.
1. E-mail notifications - I have some simple e-mail notifications wired up for things such as signing up, changing passwords, and etc. I have chosen to comment this logic out at this time due to the complexity behind e-mail rules and using gmail as sender (not allowed). In a production situation, of course this would be something to put into play.
1. Admin vs Shopping User - Right now, any user logged in can access admin routes and create new products in the overall store. That same user can then add items to a cart and create an order. So there are mixed roles here. This could be enhanced by adjusting the DB schema and code flow to create an Admin schema or to at least have an admin property on the user schema for user login that would allow for adding products to the overall store, but only allow regular users the ability to have/add to carts and create orders.
1. Payment - Payment can be added to accept payments, even mock payments for this project. I could have used something like Stripe to accomplish this.
1. Invoices - Right now I am creating a rough PDF dynamically based on the information stored in the order document. I'm sending that back to the client and storing it on the file system, as if it were going to be used by the store to fulfill the item. An increment to that would be to store that invoice in an AWS S3 bucket, and also e-mail it to the user.
1. UI - The UI leaves much to be wanted. Of course this could be enhanced, or decoupled into it's own application with the server being adjuste to provide the same funcitionality through REST endpoints instead of serving HTML files.
1. Cors - Right now I am letting any request in. I would want to limit this to the domain of the client if this were going to be loosly couped with a frontend.
1. Auth - This is a basic auth flow. Ideally, I would leverage more robust auth libraries or services for something more critical.
1. Unit testing
1. CI/CD and different branches/envs - Keeping everything on main branch directly as I one person.
