const dbUsername = process.env.ORIENTDB_USERNAME;
const dbPassword = process.env.ORIENTDB_PASSWORD;
const dbHost = process.env.ORIENTDB_HOST || "localhost";
const dbGremlinServerPort = process.env.GremlinServerPort || "8182";

export const config = {
  dbUsername,
  dbPassword,
  dbHost,
  dbGremlinServerPort,
};
