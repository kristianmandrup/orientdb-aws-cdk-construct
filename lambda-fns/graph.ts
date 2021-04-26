import * as gremlin from "gremlin";
import { config } from "./db-config";

export const createGraph = () => {
  const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

  const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
    config.dbUsername,
    config.dbPassword
  );
  const traversal = gremlin.process.AnonymousTraversalSource.traversal;
  const dc = new DriverRemoteConnection(
    `ws://${config.dbHost}:${config.dbGremlinServerPort}/gremlin`,
    {
      authenticator: authenticator,
    }
  );
  const g = traversal().withRemote(dc);
  return { dc, g };
};
