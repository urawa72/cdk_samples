package main

import (
	"context"
	// "crypto/tls"
	// "crypto/x509"
	"encoding/json"
	"fmt"
	// "io/ioutil"
	"os"
	// "time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/secretsmanager"
	// "github.com/go-sql-driver/mysql"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Book struct {
  gorm.Model
  Name  string
  Price int
}
type UserInfo struct {
	UserName	string	`json:"username"`
	Password	string	`json:"password"`
}

var userInfo UserInfo
var globalDb *gorm.DB


func init() {
 	session, err := session.NewSession()
	if err != nil {
 		fmt.Println("[ERROR]", err)
		return
	}

	svc := secretsmanager.New(session)
	input := secretsmanager.GetSecretValueInput{
		SecretId: aws.String(os.Getenv("RDS_SECRET_NAME")),
	}

	result, err := svc.GetSecretValue(&input)
	if err != nil {
 		fmt.Println("[ERROR]", err)
		return
	}

	secrets := *result.SecretString
	json.Unmarshal([]byte(secrets), &userInfo)

 	dsn := fmt.Sprintf(
        "%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local",
        userInfo.UserName,
        userInfo.Password,
        os.Getenv("PROXY_ENDPOINT"),
        "3306",
    )

 	// rootCertPool := x509.NewCertPool()
	// pem, err := ioutil.ReadFile("AmazonRootCA1.pem")
	// if err != nil {
	// 	fmt.Println(err)
	// }
	// if ok := rootCertPool.AppendCertsFromPEM(pem); !ok {
	// 	fmt.Println("Failed to append PEM.")
	// }
    //
	// mysql.RegisterTLSConfig("custom", &tls.Config{
	// 	RootCAs: rootCertPool,
	// })
    //
	// host := os.Getenv("PROXY_ENDPOINT") + ":3306"
	// config := mysql.Config{
	// 	User: userInfo.UserName,
	// 	Passwd: userInfo.Password,
	// 	Net: "tcp",
	// 	Addr: host,
 	// 	Loc: time.Local,
	// 	ParseTime: true,
	// 	TLSConfig: "custom",
	// }

	// dsn := config.FormatDSN()
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	// db, err := gorm.Open(gormMysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("[ERROR]", err)
		return
	}
	globalDb = db

	if result := globalDb.Exec("CREATE DATABASE IF NOT EXISTS gorm_test"); result.Error != nil {
		fmt.Println(result.Error)
		return
	}
	if result := globalDb.Exec("USE gorm_test"); result.Error != nil {
		fmt.Println(result.Error)
		return
	}
	if result := globalDb.Exec("CREATE TABLE IF NOT EXISTS books (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200), price INT)"); result.Error != nil {
		fmt.Println(result.Error)
		return
	}

 	globalDb.AutoMigrate(&Book{})
	globalDb.Exec("DELETE FROM books")
 	globalDb.Create(&Book{Name: "AWS 実践入門", Price: 100})
 	globalDb.Create(&Book{Name: "A Tour of Go", Price: 1000})
 	globalDb.Create(&Book{Name: "思い出の本その１", Price: 100000000})
}

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	jsonReq, _ := json.Marshal(request)
	fmt.Println(string(jsonReq))

	var books []Book
	if result := globalDb.Find(&books); result.Error != nil {
		fmt.Println(result.Error)
		return events.APIGatewayProxyResponse{Body: "Error!", StatusCode: 500}, nil
	}

	jsonBooks, _ := json.Marshal(books)
	return events.APIGatewayProxyResponse{Body: string(jsonBooks), StatusCode: 200}, nil
}

func main() {
	lambda.Start(handleRequest)
}
