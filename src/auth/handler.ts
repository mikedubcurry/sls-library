import AWS from "aws-sdk";
import express from "express";
import { v4 as uuid } from "uuid";
import { genSaltSync, hashSync, compareSync, hash } from "bcrypt";
import serverless from "serverless-http";

const app = express();

const USERS_TABLE = process.env.USERS_TABLE!;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());

// remove this endpoint after dev
app.get("/users", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
  };
  try {
    const { Items: users } = await dynamoDbClient.scan(params).promise();
    if (users) {
      res.json({ users });
    } else {
      res.status(404).json({ users: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive users" });
  }
});

app.post("/users/login", async (req, res) => {
  const { userName, password } = req.body;
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userName,
    },
  };

  try {
    const { Item: user } = await dynamoDbClient.get(params).promise();
    if (user) {
      const { userId, userName, password: hashedPw } = user;
      const passwordsMatch = compareSync(password, hashedPw);

      if (passwordsMatch) {
        res.json({ userId, userName });
      } else {
        res.status(401).json({ message: "unauthorized" });
      }
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user", message: error });
  }
});

app.post("/users/register", async (req, res) => {
  const { userName, password } = req.body;

  if (typeof userName !== "string") {
    res.status(400).json({ error: '"userName" must be a string' });
  }
  
  if (!password) {
    res.status(400).json({ error: '"password" must be included' });
  }
  const salt = genSaltSync();
  const hashedPw = hashSync(password, salt);
  const userId = uuid();
  
  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId,
      userName,
      password: hashedPw,
    },
    ConditionExpression: "attribute_not_exists(userId)",
  };
  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userName, userId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user: " + error });
  }
});

app.put("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { userName, oldPassword, newPassword } = req.body;
  if (!userName || !userId || !oldPassword || !newPassword) {
    res.status(401).json({ message: "unauthorized" });
  }
  try {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        userName,
      },
    };
    const { Item: user } = await dynamoDbClient.get(params).promise();
    if (user && compareSync(oldPassword, user.password)) {
      const salt = genSaltSync();
      const hashedPw = hashSync(newPassword, salt);
      const newUser = {
        userName,
        userId,
        password: hashedPw,
      };
      const params = {
        TableName: USERS_TABLE,
        Item: newUser,
      };

      try {
        await dynamoDbClient.put(params).promise();
        res.json({ userId, userName });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Could not update user: " + error });
      }
    } else {
      res.status(401).json({ message: "unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: "could not update user: " + error });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

export const handler = serverless(app);
