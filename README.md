# OrientDB on Fargate via AWS CDK

Install OrientDB on AWS Fargate via AWS CDK (Cloud Development Kit)

1. ## 🧰 Prerequisites

- 🛠 AWS CLI Installed & Configured - [Get help here](https://youtu.be/TPyyfmQte0U)
- 🛠 AWS CDK Installed & Configured - [Get help here](https://www.youtube.com/watch?v=MKwxpszw0Rc)
- 🛠 Python Packages, _Change the below commands to suit your operating system, the following are written for \_Amazon Linux 2_
  - Python3 - `yum install -y python3`
  - Python Pip - `yum install -y python-pip`
  - Virtualenv - `pip3 install virtualenv`

1. ## ⚙️ Setting up the environment

   ```bash
   git clone https://github.com/kristianmandrup/orientdb-aws-cdk-construct
   cd orientdb-aws-cdk-construct
   ```

1. ## 🚀 Deployment using AWS CDK

First set OS environment variables AWS_ACCOUNT and AWS_REGION to match your AWS account.

```bash
export AWS_ACCOUNT="835800058584"
export AWS_REGION="us-east-1"
```

Now install aws-cdk tooling, python tooling etc.

```bash
# If you DONT have cdk installed
npm install -g aws-cdk
# If this is first time you are using cdk then, run cdk bootstrap
# cdk bootstrap


# Make sure you in root directory
python3 -m venv .env
source .env/bin/activate
# Install any dependencies
pip install -r requirements.txt
```

Finally run the cdk synthesize and then deploy to the AWS account

```bash
# Synthesize the template and deploy it
cdk synth
cdk deploy
```

1. ## 🧹 CleanUp

If you want to destroy all the resources created by the stack, Execute the below command to delete the stack, or _you can delete the stack from console as well_

```bash
cdk destroy *
```

This is not an exhaustive list, please carry out other necessary steps as maybe applicable to your needs.

## Typescript

The project contains a few experimental stacks in typescript for OrientDb.
Please customize to fit your requirements.

You will need to use a manual boostrap of your EC2 or Fargate instance.
You can supply the following bootstrap script to your instance.
It will install docker and docker-compose ready for use and execute `docker-compose up -d`

```sh
#! /bin/sh
yum update -y

# install docker
amazon-linux-extras install docker
service docker start

# allow EC2 to use docker (without sudo) via ec2-user
usermod -a -G docker ec2-user
chkconfig docker on
# enable and start docker
sudo systemctl enable docker
sudo systemctl start docker

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# export ORIENTDB_ROOT_PASSWORD root
docker-compose up -d
```

Use a `docker-compose.yaml` file like the following. Note that you need to supply the environment variable `ORIENTDB_ROOT_PASSWORD` (such as in your user data script). This will set the root password to that value on the first instantiation of OrientDb.

```yaml
version: "3"
services:
  db:
    image: orientdb:${ORIENTDB_IMAGE}
    environment:
      - "ORIENTDB_ROOT_PASSWORD=${ORIENTDB_ROOT_PASSWORD}"
    tty: true
    volumes:
      - "./config:/orientdb/config"
      - "./databases:/orientdb/databases"
      - "./backup:/orientdb/backup"
      - "./db:/db"
    ports:
      - "2424:2424"
      - "2480:2480"
```

For the `ORIENTDB_IMAGE` environment variable, use either `3.1.11` or `3.1.11-tp3` (to include TinkerPop 3 Gremlin server)

OrientDB exposes port `2424` to execute the binary (over `TCP` or `SSH` or similar) and port `2480` for HTTP (internet) access.

If you use an image with Gremlin Server included, the Gremlin Server is exposed on port `8182`. You must then include an additional ports entry.

```yaml
ports:
  - "2424:2424"
  - "2480:2480"
  - "8182:8182"
```

## EC2 instance

An EC2 instance can be configured for OrientDb as follows, using User Data to customize and control bootstrapping behaviour.

A sample EC2 CDK stack can be found in `src/orientdb-ec2-stack.ts` (untested)

```ts
const instance = new ec2.Instance(this, "orientdb-instance", {
   // ...
}

const userScript = fs.readFileSync("src/user_script.sh", "utf8");

// add user script to instance
// this script runs when the instance is started
instance.addUserData(userScript);
```

### Fargate

See [FargateCluster](https://docs.aws.amazon.com/cdk/api/latest/python/aws_cdk.aws_eks/FargateCluster.html)

`bootstrap_enabled` (Optional[bool]) – Configures the EC2 user-data script for instances in this autoscaling group to bootstrap the node (invoke /etc/eks/bootstrap.sh) and associate it with the EKS cluster. If you wish to provide a custom user data script, set this to false and manually invoke `autoscalingGroup.addUserData()`. Default: `true`

A sample Fargate CDK stack can be found in `src/orientdb-fargate-stack.ts` (untested)

### Clustered Fargate setup

See [http-api-aws-fargate-cdk](https://github.com/aws-samples/http-api-aws-fargate-cdk) sample setup

AWS Cloud Map allows us to register any application resources, such as microservices, and other cloud resources, with custom names.

Using AWS Cloud Map, we can define custom names for our application microservices, and it maintains the updated location of these dynamically changing microservices.

This is ideal for when we set up a replication cluster as we need to define the host names or IP addresses of the cluster nodes in the configuration file.

Ideally you would generate the cluster config files (`config/orientdb-server-config.xml` and `distributed-db-config.json`) by templating, passing in the fargate service names (an OrientDB cluster node can be seen as just another "service").
For templating see [EJS documentation](https://ejs.co/#install). A sample EJS template for generating xml for `tcp-ip` members have been included in the `src/templates` folder.

```ejs
<tcp-ip enabled="true">
  <% members.forEach( function(member) { %>
    <member><%= member %></member>
  <% }); />
</tcp-ip>
```

You could also use [jstoxml](https://www.npmjs.com/package/jstoxml?activeTab=readme) on a Javascript structure as follows

```js
const tcpIp = 'tcp-ip': {
  _attrs: {
    enabled: true
  },
  _content: [
    {
      member: {
        _content: 'my-host-name:port'
      }
    },
    {
      member: {
        _content: 'my-host-name-2:port'
      }
    },
  ]
}

const xml = toXML(tcpIp)
```

Would generate:

```xml
<tcp-ip enabled="true">
    <member>my-host-name:port</member>
    <member>my-host-name-2:port</member>
</tcp-ip>
```

See the section [Configuring replication](#Configuring-replication) below.

You can also use named fargate services as micro services to execute business logic, such as handling API calls from a REST or GraphQL API and execute commands on the OrientDB cluster.

#### VPC

This single line of code creates a OrientVPC with two Public and two Private Subnets.

`const vpc = new ec2.Vpc(this, "OrientVPC");`

#### ECS Cluster

This creates an Amazon ECS cluster inside the OrientVPC, we shall be running the two microservices inside this ECS cluster using AWS Fargate.

```js
const cluster = new ecs.Cluster(this, "Orient Cluster", {
  vpc: vpc,
});
```

#### Cloud Map Namespace

AWS Cloud Map allows us to register any application resources, such as microservices, and other cloud resources, with custom names.Using AWS Cloud Map, we can define custom names for our application microservices, and it maintains the updated location of these dynamically changing microservices.

```js
const dnsNamespace = new servicediscovery.PrivateDnsNamespace(
  this,
  "DnsNamespace",
  {
    name: "http-api.local",
    vpc: vpc,
    description: "Private DnsNamespace for Microservices",
  }
);
```

#### ECS Task Role

```js
const taskrole = new iam.Role(this, "ecsTaskExecutionRole", {
  assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
});

taskrole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName(
    "service-role/AmazonECSTaskExecutionRolePolicy"
  )
);
```

#### Task Definitions

A task definition is required to run Docker containers in Amazon ECS, we shall create the task definitions (`bookServiceTaskDefinition` and `authorServiceTaskDefinition`) for the two microservices.

You should create factory functions to encapsulate your conventions.

```js
const createFargateTaskDefinition = (name, opts = {}) => Fargnew ecs.FargateTaskDefinition(
  this,
  name,
  {
    memoryLimitMiB: 512,
    cpu: 256,
    taskRole: taskrole,
    ...opts
  }
);

const bookServiceTaskDefinition = createFargateTaskDefinition("bookServiceTaskDef")
const authorServiceTaskDefinition = createFargateTaskDefinition("authorServiceTaskDef")
```

#### Security Groups

In order to control the inbound and outbound traffic to Fargate tasks, we shall create two security groups that act as a virtual firewall.

```js
const createSecurityGroup = (name, opts = {}) => {
  const secGrp = new ec2.SecurityGroup(this, name, {
    allowAllOutbound: true,
    securityGroupName: name,
    vpc: vpc,
    ...opts,
  });
  secGrp.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
  return secGrp;
};

const bookServiceSecGrp = createSecurityGroup("bookServiceSecurityGroup");
const authorServiceSecGrp = createSecurityGroup("authorServiceSecurityGroup");
```

#### Named Fargate Services

Let us create two ECS Fargate services (`bookService` & `authorService`) based on the task definitions created above. An Amazon ECS service enables you to run and maintain a specified number of instances of a task definition simultaneously in an Amazon ECS cluster. If any of your tasks should fail or stop for any reason, the Amazon ECS service scheduler launches another instance of your task definition to replace it in order to maintain the desired number of tasks in the service.

```js
const createService = (name, opts = {}) =>
  new ecs.FargateService(this, name, {
    cluster: cluster,
    taskDefinition: bookServiceTaskDefinition,
    assignPublicIp: false,
    desiredCount: 2,
    securityGroup: bookServiceSecGrp,
    cloudMapOptions: {
      name,
    },
    ...opts,
  });

const bookService = createService("bookService");
const authorService = createService("authorService");
```

Note the `cloudMapOptions` entry for each.

#### ALB

The load balancer distributes incoming application traffic across multiple ECS services, in multiple Availability Zones. This increases the availability of your application. Let us add an Application Load Balancer.

```js
const httpapiInternalALB = new elbv2.ApplicationLoadBalancer(
  this,
  "httpapiInternalALB",
  {
    vpc: vpc,
    internetFacing: false,
  }
);
```

#### ALB Listener

An ALB listener checks for connection requests from clients, using the protocol and port that we configure.

```js
const httpapiListener = httpapiInternalALB.addListener("httpapiListener", {
  port: 80,
  // Default Target Group
  defaultAction: elbv2.ListenerAction.fixedResponse(200),
});
```

#### Target Groups

We shall create two target groups, `bookServiceTargetGroup` for `bookService` microservice and `authorServiceTargetGroup` for `authorService` microservice.

```js
const addServiceTargetGroup = (name, targets, path, priority, opts = {}) =>
  httpapiListener.addTargets(name, {
    port: 80,
    priority,
    healthCheck: {
      path: `${path}/health`,
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(3),
    },
    targets: targets,
    pathPattern: `${path}*`,
    ...opts,
  });

const bookServiceTargetGroup = addServiceTargetGroup(
  "bookServiceTargetGroup",
  [bookService],
  "/api/books",
  1
);

const authorServiceTargetGroup = httpapiListener.addTargets(
  "authorServiceTargetGroup",
  [authorService],
  "/api/authors",
  2
);
```

#### VPC Link

It is easy to expose our HTTP/HTTPS resources behind an Amazon VPC for access by clients outside of the Orient VPC using API Gateway private integration. To extend access to our private VPC resources beyond the VPC boundaries, we can create an HTTP API with private integration for open access or controlled access. The private integration uses an API Gateway resource of `VpcLink` to encapsulate connections between API Gateway and targeted VPC resources.

As an owner of a VPC resource, we are responsible for creating an Application Load Balancer in our Orient VPC and adding a VPC resource as a target of an Application Load Balancer's listener. As an HTTP API developer, to set up an HTTP API with the private integration, we are responsible for creating a `VpcLink` targeting the specified Application Load Balancer and then treating the `VpcLink` as an effective integration endpoint. Let us create a `Vpclink` based on the private subnets of the `OrientVPC`.

```js
this.httpVpcLink = new cdk.CfnResource(this, "HttpVpcLink", {
  type: "AWS::ApiGatewayV2::VpcLink",
  properties: {
    Name: "http-api-vpclink",
    SubnetIds: vpc.privateSubnets.map((m) => m.subnetId),
  },
});
```

### Splitting Read and Write to Master and Replica

We could follow the pattern in the [neptune-appsync CDK stack](https://github.com/dabit3/cdk-appsync-neptune/blob/main/lib/appsync-neptune-stack.ts) to have one url point to a master (cluster?) for writes, and one to a replica (cluster?) for reads.

```js
const cluster = new orient.DatabaseCluster(this, "OrientCluster", {
  vpc,
  instanceType: orient.InstanceType.R5_LARGE,
});

cluster.connections.allowDefaultPortFromAnyIpv4("Open to the world");

const writeAddress = cluster.clusterEndpoint.socketAddress;

new cdk.CfnOutput(this, "writeaddress", {
  value: writeAddress,
});

const readAddress = cluster.clusterReadEndpoint.socketAddress;

new cdk.CfnOutput(this, "readaddress", {
  value: readAddress,
});

lambdaFn.addEnvironment("WRITER", writeAddress);
lambdaFn.addEnvironment("READER", readAddress);
```

The lambdas that mutate data (write) would then reference the `WRITER` address while any lambda that query (read) data would reference the `READER` address.

```js
const uri = process.env.WRITER

async function createPost(post: Post) {
    let dc = new DriverRemoteConnection(`wss://${uri}/gremlin`, {})
```

For the pattern above to work seamlessly we would need to create a custom construct for `orient.DatabaseCluster`.

### OrientDB configuration

For custom configuration of OrientDB, use the config files in the `config` folder. The main OrientDB config file is `config/orientdb-server-config.xml`

The `docker-compose.yaml` file is configured to create the following volumes, one of which is for the `config` folder

```yaml
volumes:
  - "./config:/orientdb/config"
  - "./databases:/orientdb/databases"
  - "./backup:/orientdb/backup"
  - "./db:/db"
```

These volumes [match the volumes of the official OrientDb Dockerfile](https://github.com/orientechnologies/orientdb-docker/blob/master/release/3.1.x/3.1.11/Dockerfile#L35)

The official Docker image downloads the orientDb distribution from [here](https://repo1.maven.org/maven2/com/orientechnologies/orientdb-community/3.1.11/)

The OrientDB gremlin server can be found [here](https://repo1.maven.org/maven2/com/orientechnologies/orientdb-gremlin-server/3.1.11/)

See the following resources for detailed OrientDB configuration guides.

- [Server-Security](https://orientdb.com/docs/2.2.x/Server-Security.html)
- [Security-Config](https://orientdb.com/docs/2.2.x/Security-Config.html)
- [Distributed-Configuration](https://orientdb.com/docs/2.2.x/Distributed-Configuration.html)

Configuring an OrientDb cluster is (currently) outside the scope of this project. Please feel to make suggestions or PRs to include documentation or constructs for creating proper OrientDb clusters.

## Studio UI to manage databases and graphs

Follow the [Run the Studio](https://orientdb.com/docs/3.0.x/gettingstarted/Tutorial-Run-the-studio.html)

### Graph editor

The Graph Editor is part of the Studio

Go to `http://<db host>:2480`

Follow the [Graph Editor](https://orientdb.com/docs/3.0.x/studio/working-with-data/graph-editor/) tutorial

- Add Vertices
- Save the Graph Rendering Configuration
- Clear the Graph Rendering Canvas
- Delete Vertices
- Remove Vertices from Canvas
- Edit Vertices
- Inspect Vertices
- Change the Rendering Configuration of Vertices
- Navigate Relationships
- Create Edges between Vertices
- Delete Edges between Vertices
- Inspect Edges
- Edit Edges

## Create a Database

Follow the [Create Db tutorial](https://orientdb.com/docs/3.0.x/fiveminute/java-1.html)

Go to `http://<orientdb host>:2480/studio/index.html`

- Click on `NEW DB`
- Enter the database name and the credentials for the `root` user
- Click `Create Database`

## REST API

[Orient DB REST API](https://orientdb.org/docs/3.0.x/misc/OrientDB-REST.html)

### Authentication and Security

See [Authentication and Security](https://orientdb.org/docs/3.0.x/misc/OrientDB-REST.html#authentication-and-security)

All the commands (but the `Disconnect` need a valid authentication before to get executed. The OrientDB Server checks if the `Authorization` HTTP header is present, otherwise answers with a request of authentication (HTTP error code: `401`).

The HTTP client (or the Internet Browser) must send `user` and `password` using the _HTTP Base authentication_. Password is encoded using `Base64` algorithm. Please note that if you want to encrypt the password using a safe mode take in consideration to use SSL connections.

When using POST and PUT the following are important when preparing the contents of the post message:

Always have the content type set to “application/json” or "application/xml"
Where data or data structure is involved the content is in JSON format

## Create Database via REST API

To [create a Database via the REST API](https://orientdb.org/docs/3.0.x/misc/OrientDB-REST.html)

Syntax: `http://<server>:[<port>]/database/<database>/<type>`

HTTP POST request: `http://localhost:2480/database/demo/plocal`

HTTP response:

```json
{
  "classes": [],
  "clusters": [],
  "users": [],
  "roles": [],
  "config": [],
  "properties": {}
}
```

## Connect via REST API

Connect to a remote server using basic authentication.

Syntax: `http://<server>:[<port>]/connect/<database>`

Example

HTTP GET request: `http://localhost:2480/connect/demo` HTTP response: `204` if ok, otherwise `401`.

### GET Database

HTTP GET request: `http://localhost:2480/database/demo` HTTP response:

```json
{
  "server": {
    "version": "1.1.0-SNAPSHOT",
    "osName": "Windows 7",
    "osVersion": "6.1",
    "osArch": "amd64",
    "javaVendor": "Oracle Corporation",
    "javaVersion": "23.0-b21"
  },
  "classes": []
}
```

### AppSync

We have included skeleton files for setting up AWS AppSync with OrientDb, so that the GraphDb can be used with a GraphQL API. Please help make this dream a reality. The bulk of the AppSync code can be found in:

- `bin`
- `lambda-fns`
- `src/appsync-orientdb-stack`

It is a currently a Work In Progress (WIP)

## OrientDB NodeJs/Javascript driver

- [orientjs](https://www.npmjs.com/package/orientjs)

```js
const OrientDBClient = require("orientjs").OrientDBClient;

OrientDBClient.connect({
  host: "localhost",
  port: 2424,
})
  .then((client) => {
    return client.close();
  })
  .then(() => {
    console.log("Client closed");
  });
```

Once obtained a session using the above APIs you can:

- Run a Query (Idempotent SQL statement)
- Run a Command (Idempotent or non idempotent SQL statement)
- Run a Transaction
- Run a live query

See [OrientDB Tutorials point](https://www.tutorialspoint.com/orientdb/orientdb_create_database.htm)

### Create database using command

See [Create database command](https://www.tutorialspoint.com/orientdb/orientdb_create_database.htm)

The following command should create a database demo

`CREATE DATABASE PLOCAL:/orientdb/databases/demo`

See also this [gitbook](https://orientdb-cn.gitbooks.io/doc2-1-x/content/Console-Command-Create-Database.html)

To create a remote database, you must pass root username and password for the remote OrientDB instance `CREATE DATABASE REMOTE:192.168.1.1/trick root E30DD873203AAA245952278B4306D94E423CF91D569881B7CAD7D0B6D1A20CE9 PLOCAL`

```js
session
  .command("create database PLOCAL:/orientdb/databases/demo")
  .all()
  .then((result) => {
    console.log(result);
  });
```

You can also use the `Server.create` API directly

```js
/**
 * Create a database with the given name / config.
 *
 * @param  {String|Object} config The database name or configuration object.
 * @promise {Db}                  The database instance
 */
Server.prototype.create = function (config) {
  // ...
};
```

`type` can be `graph` or `document`
`storage` can be `plocal` or `memory`

```js
const orientdb = require("orientjs");

const SERVER_CONFIG = {
  host: "localhost",
  port: 2424,
  httpPort: 2480,
  username: "root",
  password: "root",
};

const SERVER = new orientdb.Server({
  host: SERVER_CONFIG.host,
  port: SERVER_CONFIG.port,
  username: SERVER_CONFIG.username,
  password: SERVER_CONFIG.password,
  transport: "binary",
});

// create an in-memory graph DB named testdb_server
return SERVER.create({
  name: "testdb_server",
  type: "graph",
  storage: "memory",
}).then(function (db) {
  console.log("db created:", db);
});
```

For ECMAscript modules interop use `import * as orientdb from 'orientjs';`

To use the REST API as the transport layer, simply set `transport` to `rest`

```js
const SERVER = new orientdb.Server({
  host: SERVER_CONFIG.host,
  port: SERVER_CONFIG.port,
  username: SERVER_CONFIG.username,
  password: SERVER_CONFIG.password,
  transport: "rest", // <-- Use REST API
});
```

By default, when a new database is created, three default roles and their respective users are created.

The roles are `admin`, `reader`, and `writer`. Three users are also created corresponding to each role: `admin`, `reader`, and `writer`.

A default password is also created for each user. The password is the same as the user's name (e.g., the `admin` user's password is set to `admin`).

SECURITY RECOMMENDATION: Disable creation of default users.

To disable the creation of defaults roles and users when a database is created edit the `security.json` file in the config directory. Set the `createDefaultUsers` property to false.

```json
"server": {
  "createDefaultUsers": false
},
```

Be sure to read the [OrientDB Security Guide](https://orientdb.com/docs/3.0.x/security/OrientDB-Security-Guide.html) for best practices regarding security.

### Alternative OrientDB APIs

- [orientdb nodejs gremlin](https://discourse.orientdb.org/t/orientdb-nodejs-gremlin/696/2)
- [gremlin-node](https://github.com/inolen/gremlin-node)
- [Apache gremlin-javascript](https://tinkerpop.apache.org/docs/current/reference/#gremlin-javascript)
- [ts-tinkerpop](https://github.com/RedSeal-co/ts-tinkerpop)
- [awesome tinkerpop](https://awesomeopensource.com/project/mohataher/awesome-tinkerpop?categoryPage=35)

Executing Gremlin/TinkePop

```js
const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
  "root",
  "root"
);
const remote = new gremlin.driver.DriverRemoteConnection(
  "ws://localhost:8182/gremlin",
  {
    authenticator,
    traversalSource: "g",
  }
);
remote.addListener("socketError", (error) => {
  console.log(`socketError: ${error}`);
});
try {
  remote.open();
  const g = await traversal().withRemote(remote);
  const results = g.V().toList();
} catch (e) {
  console.log(e);
}
```

ECMA Script example

```js
import * as gremlin from "gremlin";
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

const dbUsername = process.env.dbUsername;
const dbPassword = process.env.dbPassword;

const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
  dbUsername,
  dbPassword
);
const traversal = gremlin.process.AnonymousTraversalSource.traversal;

const host = process.env.dbHost || "localhost";

const g = traversal().withRemote(
  new DriverRemoteConnection(`ws://${host}:8182/gremlin`, {
    authenticator: authenticator,
  })
);
```

## OrientDB Gremlin REST API

The easiest and quickest way to execute a gremlin query against OrientDB is to use the REST API (port 2480, NOT binary port 2424). It is one call, I suggest trying it out first in postman.

```sh
[POST] http://:2480/command//gremlin
```

Then the request body can look like this:

```json
{
  "command": "g.V().has('name', 'marko')"
}
```

Pass the OrientDB credentials as basic auth

In NodeJS/JavaScript simply use superagent or a similar module to call the REST API. Then analyze the results which are returned as JSON.

See also: [OrientDB-REST](https://orientdb.com/docs/last/OrientDB-REST.html)

## Configuring replication

[How to configure replication in orientdb](https://difyel.com/orientdb/how-to-configure-replication-in-orientdb/index.html)

The default configuration in `orientdb-server-config.xml` is sufficient .

```xml
<!-- orientdb-version/config/orientdb-server-config.xml -->
<handler class="com.orientechnologies.orient.server.hazelcast.OHazelcastPlugin">
    <parameters>
        <parameter value="${distributed}" name="enabled"/>
        <parameter value="${ORIENTDB_HOME}/config/default-distributed-db-config.json" name="configuration.db.default"/>
        <parameter value="${ORIENTDB_HOME}/config/hazelcast.xml" name="configuration.hazelcast"/>
        <parameter value="development" name="nodeName"/>
    </parameters>
</handler>
```

To configure the replication protocol, edit `orientdb-server-config.xml`, for each server.

```xml
<!-- The config/orientdb-server-config.xml file .-->
<?xml version="1.0" encoding="UTF-8"?>
<hazelcast
        xsi:schemaLocation="http://www.hazelcast.com/schema/config">
 
    <group>
        <name>orientdb</name>
        <password>orientdb</password>
    </group>
 
    <properties>
        <property name="hazelcast.phone.home.enabled">false</property>
        ...
    </properties>
 
    <network>
        <port auto-increment="false">2434</port>
        <join>
 
            <multicast enabled="false">
                <multicast-group>235.1.1.1</multicast-group>
                <multicast-port>2434</multicast-port>
            </multicast>
 
            <tcp-ip enabled="true">
                <member>ipaddress</member>
                <member>ipaddress:port</member>
                <member>host</member>
                <member>host:port</member>
                ...
            </tcp-ip>
 
        </join>
    </network>
 
    <executor-service>
        <pool-size>16</pool-size>
    </executor-service>
 
</hazelcast>
```

The group `name` and `password`, are the cluster's name and password. Make sure to change them, and to choose a _secure password_.

The `network` is the network protocol to be used. The network protocol can be set to `multicast`, if on the local network or on the same PC. In such a case, nothing is to be configured, just make sure that `multicast` is enabled, as in `enabled="true"`

If on different or remote networks (such as on separate EC2 instance on AWS) the network protocol can be set to `tcp-ip`. For `tcp-ip`, you can specify the _IP address_ or _host name_ with optionally a `port` number , as in `192.168.0.4:2424`.

For each server, that is to be part of the group, just add its details using the member tag.

```xml
<tcp-ip enabled="true">
    <member>192.168.0.4:2424</member>
    <member>192.168.0.5:2424</member>
    ...
</tcp-ip>
```

Having configured the network protocol , it is time to configure database replication , which can be done in `default-distributed-db-config.json`. This file is copied, and updated as `distributed-config.json`, to each database folder in `/databases`

```json
// The config/default-distributed-db-config.json file .
{
  "autoDeploy": true,
  "executionMode": "undefined",
  "readQuorum": 1,
  "writeQuorum": "majority",
  "readYourWrites": true,
  "newNodeStrategy": "static",
  "servers": {
    "production": "master",
    "development": "replica"
  },
  "clusters": {
    "internal": {},
    "*": {
      "servers": [""]
    }
  }
}
```

`servers` What is the role of each server , for example the server which was given the name of `production` is a `master`, and the one given the name of `development` is `replica`. `"servers":{"*": "master"}` , can be used to state that all servers are masters.

More than one master can be configured , a replica server is just a replica , it does not count into voting in `writeQuorum`.

In the example, two nodes were specified, one as being a `master` and the second one as being a `replica`, other configuration options, are explained in the preceding code, as in having all nodes to be masters, which is the default.

That is it for configuring replication using orientdb , the servers can be started using `./dserver.sh` . Start the `replica` after the `master`.

To check if everything is working correctly, a database can be created as in `create database remote:localhost/nameOfDb root thePassword`, on the `master` server, using the console, which can be launched from the `bin` folder, and using the console in the `replica` server. After issuing the command `connect remote:localhost/ root thePassword`, the command `List databases` can be run to verify that the created database has been replicated.

## Enabling SSL using Certificates

Also see [Using SSL with OrientDB](https://orientdb.com/docs/last/security/Using-SSL-with-OrientDB.html) for how to configure SSL using certificates.

To create key and trust stores that reference a self-signed certificate, use the following guide:

Using Keytool, create a certificate for the server:

```sh
keytool -genkey -alias server -keystore orientdb.ks -keyalg RSA -keysize 2048 -validity 3650
```

Export the server certificate to share it with client:

```sh
keytool -export -alias server -keystore orientdb.ks -file orientdb.cert
```

Create a certificate/keystore for the console/clients:

```sh
keytool -genkey -alias console -keystore orientdb-console.ks -keyalg RSA -keysize 2048 -validity 3650
```

Create a trust-store for the client, then import the server certificate.

```sh
keytool -import -alias server -keystore orientdb-console.ts -file orientdb.cert
```

This establishes that the client trusts the server. You now have a self-signed certificate to use with OrientDB

The server configuration file, `$ORIENTDB_HOME/config/orientdb-server-config.xml`, does not use SSL by default. To enable SSL on a protocol listener, you must change the socket attribute to the `<listener>` value from default to one of your configured `<socket>` definitions.

There are two default definitions available: ssl and https. For most use cases this is sufficient, however you can define more if you want to secure different listeners with their own certificates or would like to use a custom factory implementations. When using the ssl implementation, bear in mind that the default port for OrientDB SSL is `2434`. You need to change your port range to `2434-2440`.

By default, the OrientDB server looks for its keys and trust-stores in `$ORIENTDB_HOME/config/cert`

### OrientDB Solution construct

Ideally we aim to create an OrientDb CDK construct that can be reused in any stack. See [CDK Solution constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html).

A skeleton construct can be found in `src/orientdb-construct`. Please help make it a reality :)

_AWS Solutions Constructs (Constructs) is an open-source extension of the AWS Cloud Development Kit (AWS CDK) that provides multi-service, well-architected patterns for quickly defining solutions in code to create predictable and repeatable infrastructure._

### Resources

#### Books

- [Book: Getting started with OrientDB](https://allitbooks.net/programming/4050-getting-started-orientdb.html)
- [Free E-book: Installing OrientDb](https://riptutorial.com/Download/orientdb.pdf)

#### Courses

- [Free OrientDB Udemy course - Getting started](https://www.udemy.com/course/orientdb-getting-started)

#### GraphDB and Gremlin guides

- [Gremlin Graph Guide](https://www.kelvinlawrence.net/book/Gremlin-Graph-Guide.html)
- [Graph Dbs](https://uhack-guide.readthedocs.io/en/latest/technical/graph-dbs/)

### 💡 Help/Suggestions or 🐛 Bugs

Thank you for your interest in contributing to this project. Whether it is a bug report, new feature, correction, or additional documentation or solutions, we greatly value feedback and contributions from our community.
