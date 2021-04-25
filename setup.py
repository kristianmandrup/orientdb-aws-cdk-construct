import setuptools


with open("README.md") as fp:
    long_description = fp.read()


setuptools.setup(
    name="orientdb_cdk_construct",
    version="0.0.1",

    description="OrientDB CDK construct",
    long_description=long_description,
    long_description_content_type="text/markdown",

    author="Kristian Mandrup",

    package_dir={"": "orientdb_aws_cdk_construct"},
    packages=setuptools.find_packages(where="orientdb_aws_cdk_construct"),

    install_requires=[
        "aws-cdk.core>=1.36.0",
    ],

    python_requires=">=3.6",

    classifiers=[
        "Development Status :: 4 - Beta",

        "Intended Audience :: Developers",

        "License :: OSI Approved :: Apache Software License",

        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",

        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",

        "Typing :: Typed",
    ],
)
