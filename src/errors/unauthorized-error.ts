import { ApplicationError } from "@/protocols";

export function unauthorizedError(): ApplicationError {
  return {
    name: "UnauthorizedError",
    message: "You must be signed in to continue",
  };
}

export function unauthorizedErrorNoBooking(): ApplicationError {
  return {
    name: "UnauthorizedError-noBooking",
    message: "There is no booking by user",
  };
}

