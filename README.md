# Seniot™ Gateway

(Powered by FPT-Software)

The current version supports only AWS IoT Platform. You must configure the DOCKER VOLUMES pointed to a LOCAL FOLDER that contains the AWS credentials. It's included:

**Thing's credential**
+ Go to https://ap-northeast-1.console.aws.amazon.com/iot/home?region=ap-northeast-1
+ In AWS IoT Resource Management, select *Create a resource/Create a thing/#[Connect to device]*
+ Download all the credentials into ($HOME)/LOCAL_FOLDER/ it looks like:

>($HOME)/LOCAL_FOLDER/**certId**-certificate.pem.crt 
>($HOME)/LOCAL_FOLDER/**certId**-private.pem.key 
>($HOME)/LOCAL_FOLDER/**certId**-public.pem.key 

**AWS IoT SSL Root Certificate**

>($HOME)/LOCAL_FOLDER/root-CA.crt

For the Root Certificate, you can download the root certificate from https://www.symantec.com/content/en/us/enterprise/verisign/roots/VeriSign-Class%203-Public-Primary-Certification-Authority-G5.pem and change the name into *root-CA.crt*
