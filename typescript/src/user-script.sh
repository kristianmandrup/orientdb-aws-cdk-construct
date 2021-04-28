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