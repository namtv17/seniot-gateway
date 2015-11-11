# Seniot™ Gateway

(Powered by FPT-Software)

The current version supports only AWS IoT Platform. You must configure the DOCKER VOLUMES pointed to a LOCAL FOLDER that contains the AWS credentials. It's included:

**Thing's one credential**
+ Go to https://ap-northeast-1.console.aws.amazon.com/iot/home?region=ap-northeast-1
+ In AWS IoT Resource Management, select *Create a resource/Create a thing*
+ Download all the credentials into ($HOME)/LOCAL_FOLDER/ and change the file names into:

>($HOME)/LOCAL_FOLDER/**47d4932ed6**-certificate.pem.crt
($HOME)/LOCAL_FOLDER/**47d4932ed6**-private.pem.key
($HOME)/LOCAL_FOLDER/**47d4932ed6**-public.pem.key

The ID **47d4932ed6** is temporary hard-coded inside the AWS configuration node

**Thing's two credential**
+ Go to https://ap-northeast-1.console.aws.amazon.com/iot/home?region=ap-northeast-1
+ In AWS IoT Resource Management, select *Create a resource/Create a thing*
+ Download all the credentials into ($HOME)/LOCAL_FOLDER/ and change the file names into:

>($HOME)/LOCAL_FOLDER/**4b3f24b626**-certificate.pem.crt
($HOME)/LOCAL_FOLDER/**4b3f24b626**-private.pem.key
($HOME)/LOCAL_FOLDER/**4b3f24b626**-public.pem.key

The ID **4b3f24b626** is temporary hard-coded inside the AWS configuration node

**AWS IoT SSL Root Certificate**

>($HOME)/LOCAL_FOLDER/root-CA.crt

For the Root Certificate, you can download the root certificate from https://www.symantec.com/content/en/us/enterprise/verisign/roots/VeriSign-Class%203-Public-Primary-Certification-Authority-G5.pem and change the name into *root-CA.crt*
