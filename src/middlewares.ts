import { verify } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { getTokenFromHeader } from "./utils";
import { ROLES } from "./constants";

export function userIsAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromHeader(req.headers["authorization"]!);
  if (token) {
    try {
      let user = verify(token, process.env.JWT_SECRET!);
      if (
        user &&
        typeof user !== "string" &&
        user.data.role &&
        user.data.role === ROLES.ADMIN
      ) {
        return next();
      }
    } catch (error) {
      // do nothing
    }
  }
  return res.status(401).json({ message: "unauthroized" });
}

export function userIsAtLeastLibrarian(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getTokenFromHeader(req.headers["authorization"]!);
  if (token) {
    try {
      let user = verify(token, process.env.JWT_SECRET!);
      if (
        user &&
        typeof user !== "string" &&
        user.data.role &&
        (user.data.role === ROLES.LIBRARIAN || user.data.role === ROLES.ADMIN)
      ) {
        return next();
      }
    } catch (error) {
      // do nothing
    }
  }
  return res.status(401).json({ message: "unauthroized" });
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  return res.status(404).json({
    error: "Not Found",
  });
}
