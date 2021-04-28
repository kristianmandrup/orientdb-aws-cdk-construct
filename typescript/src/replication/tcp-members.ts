import { toXML } from "jstoxml";

export const createTcpIp = ({
  members,
  enabled,
}: {
  members: string[];
  enabled: boolean;
}) => {
  const $members = members.map((member) => ({
    _name: "member",
    _content: member,
  }));
  return {
    _name: "tcp-ip",
    _attrs: {
      enabled: enabled === undefined ? "true" : enabled,
    },
    _content: $members,
  };
};

export const createTcpIpXml = (tcpIpConfig) => {
  const elem = createTcpIp(tcpIpConfig);
  return toXML(elem);
};
