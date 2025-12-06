Extra Class Lessons App

This project is a simple Vue.js application that allows users to browse lessons, add them to a cart, and complete an order.

Main Features:

Load lessons from the backend API

Search lessons by subject, location, price, or spaces

Sort lessons by subject, location, price, or spaces

Add lessons to the cart (spaces decrease automatically)

Remove items from the cart (spaces increase back)

Simple checkout form with name and phone validation

Submit orders to the backend

How to Run:

Install all dependencies using: npm install

Start the development server using: npm run serve

Build the production version using: npm run build

API Used:
GET /lessons - returns all lessons
POST /orders - sends the order information

Validation:
Name must contain letters and spaces only.
Phone must contain numbers only.
Checkout button is disabled until the form is valid and the cart is not empty.

Configuration:
Set the API base link in your Vue app using this.$api.

Project Contents:

App.vue: main application file

main.js: app entry point

public/index.html: main HTML file