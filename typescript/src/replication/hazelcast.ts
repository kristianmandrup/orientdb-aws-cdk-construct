import { createTcpIp } from "./tcp-members";

const createGroup = ({
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

const createExecutorService = ({ poolSize }: any) => ({
  _name: "executor-service",
  _content: [
    {
      _name: "pool-size",
      _content: poolSize,
    },
  ],
});

const createPort = (port, autoIncrement = false) => ({
  _name: "port",
  _attrs: {
    "auto-increment": autoIncrement,
  },
  _content: port,
});

const createProperties = (props) => ({
  properties: {
    _content: Object.keys(props).map((key) => ({
      _name: "property",
      _attrs: {
        name: key,
      },
      _content: props[key],
    })),
  },
});

const createMultiCast = (opts: any = {}, enabled = false) => {
  const { group, port } = opts;
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

const createJoin = (config) => ({
  _name: "join",
  _content: [createMultiCast(config), createTcpIp(config)],
});

const createNetwork = (config) => ({
  _name: "network",
  _content: [createPort(config), createJoin(config)],
});

const createHazelcast = (config) => ({
  _name: "hazelcast",
  _content: [
    createGroup(config),
    createProperties(config),
    createNetwork(config),
    createExecutorService(config),
  ],
});
