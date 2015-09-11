mkdir keys
cd keys

# /C=	Country	GB
# /ST=	State	London
# /L=	Location	London
# /O=	Organization	Global Security
# /OU=	Organizational Unit	IT Department
# /CN=	Common Name	example.com

openssl genrsa -out client-key.pem 2048
openssl req -new -sha256 -key client-key.pem -out client-csr.pem  -subj "/C=XX/ST=MyState/L=MyLocation/O=MyOrg/OU=MyDep/CN=localhost"
openssl x509 -req -in client-csr.pem -signkey client-key.pem -out client-cert.pem

openssl genrsa -out client2-key.pem 2048
openssl req -new -sha256 -key client2-key.pem -out client2-csr.pem  -subj "/C=XX/ST=MyState/L=MyLocation/O=MyOrg/OU=MyDep/CN=localhost"
openssl x509 -req -in client2-csr.pem -signkey client2-key.pem -out client2-cert.pem

openssl genrsa -out server-key.pem 2048
openssl req -new -sha256 -key server-key.pem -out server-csr.pem  -subj "/C=XX/ST=MyState/L=MyLocation/O=MyOrg/OU=MyOtherDep/CN=localhost"
openssl x509 -req -in server-csr.pem -signkey server-key.pem -out server-cert.pem
