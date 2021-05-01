import { createParameters } from "../server-config";
import { createTcpIp } from "./tcp-members";

interface IProps {
  [key: string]: string;
}

export const createGroup = ({
  username,
  password,
}: {
  username: string;
  password: string;
}) => ({
  _name: "group",
  _content: [
    {
      _name: "name",
      _content: username,
    },
    {
      _name: "password",
      _content: password,
    },
  ],
});

export const createExecutorService = ({
  poolSize,
}: {
  poolSize: string | number;
}) => ({
  _name: "executor-service",
  _content: [
    {
      _name: "pool-size",
      _content: poolSize,
    },
  ],
});

export const createPort = ({
  port,
  autoIncrement,
}: {
  port: string | number;
  autoIncrement?: boolean;
}) => ({
  _name: "port",
  _attrs: {
    "auto-increment": autoIncrement,
  },
  _content: port,
});

export const createProperties = ({ properties }: { properties: IProps }) => ({
  _name: "properties",
  _content: Object.keys(properties).map((key) => ({
    _name: "property",
    _attrs: {
      name: key,
    },
    _content: properties[key],
  })),
});

export const createMultiCast = ({
  group,
  port,
  enabled,
}: {
  group: string;
  port: string | number;
  enabled: boolean;
}) => {
  return {
    _name: "multicast",
    _attrs: {
      enabled,
    },
    _content: [
      {
        _name: "multicast-group",
        _content: group,
      },
      {
        _name: "multicast-port",
        _content: port,
      },
    ],
  };
};

export const createJoin = (config) => ({
  _name: "join",
  _content: [createMultiCast(config.multicast), createTcpIp(config.tcpIp)],
});

export const createNetwork = (config) => ({
  _name: "network",
  _content: [createPort(config.port), createJoin(config.join)],
});

export const createHazelcast = (config) => ({
  _name: "hazelcast",
  _content: [
    createGroup(config.group),
    createProperties(config),
    createNetwork(config.network),
    createExecutorService(config.executor),
  ],
});

export const createAccessKey = (accessKey) => ({
  _name: "access-key",
  _content: accessKey,
});

export const createSecretKey = (secretKey) => ({
  _name: "secret-key",
  _content: secretKey,
});

export const createRegion = (region) => ({
  _name: "region",
  _content: region,
});

export const createSecurityGroupName = (name) => ({
  _name: "security-group-name",
  _content: name,
});

export const createAws = ({
  enabled,
  accessKey,
  secretKey,
  region,
  securityGroupName,
}) => ({
  _name: "aws",
  _attrs: {
    enabled,
  },
  _content: [
    accessKey && createAccessKey(accessKey),
    secretKey && createSecretKey(secretKey),
    region && createRegion(region),
    securityGroupName && createSecurityGroupName(securityGroupName),
  ],
});
