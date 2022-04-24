interface User {
  role: "GUEST" | "LIBRARIAN" | "ADMIN";
  userId: string;
  userName?: string;
  password?: string;
}
