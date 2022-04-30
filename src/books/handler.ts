import AWS from "aws-sdk";
import express from "express";
import serverless from "serverless-http";
import { notFound, userIsAtLeastLibrarian } from "../middlewares";

const app = express();

const BOOKS_TABLE = process.env.BOOKS_TABLE!;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

app.get("/books", async (req, res) => {
  const params = {
    TableName: BOOKS_TABLE,
    ProjectionExpression: "isbn, title, author, checkedOut",
  };
  try {
    const { Items: books } = await dynamoDbClient.scan(params).promise();
    if (books) {
      res.json({ books });
    } else {
      res.status(404).json({ books: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive books" });
  }
});

app.get("/books/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.redirect("/books/");
  }

  const expressionQueryValues = query
    .toString()
    .split(" ")
    .reduce((queries, q, idx) => {
      queries[`:q${idx}`] = q.toLowerCase();
      return queries;
    }, {} as ExpressionQueryValues);

  const filterQueryExpression = Object.entries(expressionQueryValues)
    .map(([key]) => {
      return `contains(searchTitle,${key}) OR contains(searchAuthor,${key})`;
    })
    .join(" OR ");

  const params = {
    TableName: BOOKS_TABLE,
    FilterExpression: filterQueryExpression,
    ExpressionAttributeValues: expressionQueryValues,
    ProjectionExpression: "isbn, title, author, checkedOut",
  };

  try {
    const books = await dynamoDbClient.scan(params).promise();
    if (books) {
      res.json({ books });
    } else {
      res.status(404).json({ books: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Could not retreive books" });
  }
});

app.get("/books/:isbn", async (req, res) => {
  const { isbn } = req.params;
  if (!isbn || isbn.length < 13) {
    res.status(400).json({ message: "please use valid isbn" });
  }
  const params = {
    TableName: BOOKS_TABLE,
    Key: {
      isbn,
    },
  };
  try {
    const { Item: book } = await dynamoDbClient.get(params).promise();
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "could not retreive book" });
  }
});

app.post("/books", userIsAtLeastLibrarian, async (req, res) => {
  const { title, author, isbn } = req.body;
  if (!title || !author || !isbn) {
    res
      .status(400)
      .json({ message: "must include title, author and isbn to add a book" });
  }
  const book = {
    isbn,
    title,
    author,
    searchTitle: title.toLowerCase().replace(/[^a-z0-9]/gi, " "),
    searchAuthor: author.toLowerCase().replace(/[^a-z0-9]/gi, " "),
    checkedOut: false,
  };
  const params = {
    TableName: BOOKS_TABLE,
    Item: book,
    ConditionExpression: "attribute_not_exists(isbn)",
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json(book);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create book"});
  }
});

app.use(notFound);

export const handler = serverless(app);
