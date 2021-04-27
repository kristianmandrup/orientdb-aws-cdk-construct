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

A sample EC2 CDK stack can be found in `lib/orientdb-ec2-stack.ts` (untested)

```ts
const instance = new ec2.Instance(this, "orientdb-instance", {
   // ...
}

const userScript = fs.readFileSync("lib/user_script.sh", "utf8");

// add user script to instance
// this script runs when the instance is started
instance.addUserData(userScript);
```

### Fargate

See [FargateCluster](https://docs.aws.amazon.com/cdk/api/latest/python/aws_cdk.aws_eks/FargateCluster.html)

`bootstrap_enabled` (Optional[bool]) – Configures the EC2 user-data script for instances in this autoscaling group to bootstrap the node (invoke /etc/eks/bootstrap.sh) and associate it with the EKS cluster. If you wish to provide a custom user data script, set this to false and manually invoke `autoscalingGroup.addUserData()`. Default: `true`

A sample Fargate CDK stack can be found in `lib/orientdb-fargate-stack.ts` (untested)

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
- `lib/appsync-orientdb-stack`

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

### OrientDB Solution construct

Ideally we aim to create an OrientDb CDK construct that can be reused in any stack. See [CDK Solution constructs](https://docs.aws.amazon.com/solutions/latest/constructs/welcome.html).

A skeleton construct can be found in `lib/orientdb-construct`. Please help make it a reality :)

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
