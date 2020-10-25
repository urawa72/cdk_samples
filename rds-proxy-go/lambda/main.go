package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/secretsmanager"

	"database/sql"
	"github.com/go-sql-driver/mysql"
)

type UserInfo struct {
	UserName string `json:"username"`
	Password string `json:"password"`
}

type Book struct {
	Id    int
	Name  string
	Price int
}

func connect() (*sql.DB, error) {
	svc := secretsmanager.New(session.New(), aws.NewConfig().WithRegion("ap-northeast-1"))

	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(os.Getenv("RDS_SECRET_NAME")),
	}

	result, err := svc.GetSecretValue(input)
	if err != nil {
		return nil, err
	}

	// Secret Managerから認証情報を取得
	var userInfo UserInfo
	secrets := *result.SecretString
	json.Unmarshal([]byte(secrets), &userInfo)

	// CA証明書の設定
	rootCertPool := x509.NewCertPool()
	absPath, _ := filepath.Abs("./cert/AmazonRootCA1.pem")
	pem, err := ioutil.ReadFile(absPath)
	if err != nil {
		return nil, err
	}

	if ok := rootCertPool.AppendCertsFromPEM(pem); !ok {
		fmt.Println("[ERROR]", "Fialed to append PEM")
	}

	mysql.RegisterTLSConfig("custom", &tls.Config{
		ClientCAs: rootCertPool,
	})

	// MySQLに接続
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/rds_proxy_go?charset=utf8mb4&parseTime=True&loc=Local&tls=custom",
		userInfo.UserName,
		userInfo.Password,
		os.Getenv("PROXY_ENDPOINT"),
		"3306",
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	jsonReq, _ := json.Marshal(request)
	fmt.Println(string(jsonReq))

	db, err := connect()
	if err != nil {
		fmt.Println("[ERROR]", err)
		return events.APIGatewayProxyResponse{Body: "Error!", StatusCode: 500}, nil
	}
	defer db.Close()

	rows, err := db.Query("SELECT * FROM books")
	if err != nil {
		fmt.Println("[ERROR]", err)
		return events.APIGatewayProxyResponse{Body: "Error!", StatusCode: 500}, nil
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		err := rows.Scan(&book.Id, &book.Name, &book.Price)
		if err != nil {
			fmt.Println("[ERROR]", err)
			return events.APIGatewayProxyResponse{Body: "Error!", StatusCode: 500}, nil
		}
		books = append(books, book)
	}

	jsonBooks, _ := json.Marshal(books)
	return events.APIGatewayProxyResponse{Body: string(jsonBooks), StatusCode: 200}, nil
}

func main() {
	lambda.Start(handleRequest)
}
