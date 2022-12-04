import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import { createEnrollmentWithAddress, createHotel, createRoomWithHotelId, createTicket, createTicketType, createTicketTypeRemote, createTicketTypeWithHotel, createUser } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { createBooking, createRoomWIthCapacity, createRoomWIthNoCapacity, updatedBoking } from "../factories/bookings-factory";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /bookings", () => {
  describe("When token is not valid", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.get("/hotels");

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("should responde with 401 when there is no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with 403 when ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 403 when ticketType is RESERVED", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 404 when there is no booking by user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      await createBooking((user.id + 1), room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("Should respond with status 200 when there is booking by user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Rooms: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: hotel.id,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        }
      });
    });
  });
});

describe("POST /booking", () => {
  describe("When token is not valid", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.post("/hotels");
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();

      const response = await server.post("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.post("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("When token is valid", () => {
    it("should responde with 401 when there is no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: faker.datatype.number() };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with 403 when ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: faker.datatype.number() };
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 403 when ticketType is RESERVED", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: faker.datatype.number() };
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 400 when idRoom isNaN", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const body = { roomId: faker.random.word() };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
    it("should responde with 404 when room do not exists", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketTypeWithHotel();
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const body = { roomId: (room.id + 1) };
      const enrollment = await createEnrollmentWithAddress(user);
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with 403 when there the room has no capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const roomcapacity = await createRoomWIthNoCapacity(hotel.id);
      const body = { roomId: roomcapacity.id };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 200 and bookingId when request is sucessfull", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWIthCapacity(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const body = { roomId: room.id };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.OK);
      expect(response.text).toEqual((booking.id + 1).toString());
    });
  });
});

describe("PUT booking/:bookingId", () => {
  describe("When token is not valid", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.put("/booking/:bookingId");
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();

      const response = await server.put("/booking/:bookingId").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.put("/booking/:bookingId").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("should respond with 400 when bookingId isNaN", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const body = { roomId: faker.datatype.number() };

      const response = await server.put("/booking/:bookingId").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
    it("should respond with 400 when roomId isNaN", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const body = { roomId: "string" };

      const response = await server.put("/booking/:bookingId").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.BAD_REQUEST);
    });
    it("should responde with 401 when there is no enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ramdomNumber = faker.datatype.number();
      const body = { roomId: ramdomNumber };

      const response = await server.put(`/booking/${ramdomNumber}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("should respond with 403 when ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const ramdomNumber = faker.datatype.number();
      const body = { roomId: ramdomNumber };

      const response = await server.put(`/booking/${ramdomNumber}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 403 when ticketType is RESERVED", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const ramdomNumber = faker.datatype.number();
      const body = { roomId: ramdomNumber };

      const response = await server.put(`/booking/${ramdomNumber}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 404 when there is no booking by user", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const body = { roomId: room.id };
      const ramdomNumber = faker.datatype.number();
      await createBooking((user.id+1), room.id);

      const response = await server.put(`/booking/${ramdomNumber}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with 404 when roomId do not exits", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const body = { roomId: (room.id+1) };
      await createBooking(user.id, room.id);

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with 403 when there the room has no capacity", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const roomcapacity = await createRoomWIthNoCapacity(hotel.id);
      await createBooking(user.id, roomcapacity.id);
      const body = { roomId: roomcapacity.id };

      const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    it("should respond with 200 and bookingId when update booking is sucessfull", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWIthCapacity(hotel.id);
      const booking = await createBooking(user.id, room.id);
      const body = { roomId: room.id };
 
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.OK);
    });
  });
});
