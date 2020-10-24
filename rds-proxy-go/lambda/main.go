package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/secretsmanager"

 	"database/sql"
 	_ "github.com/go-sql-driver/mysql"
)

type UserInfo struct {
	UserName	string	`json:"username"`
	Password	string	`json:"password"`
}

type Book struct {
	Id		int
	Name	string
	Price	int
}

var userInfo UserInfo

func connect() (*sql.DB, error) {
 	region := "ap-northeast-1"
	svc := secretsmanager.New(session.New(), aws.NewConfig().WithRegion(region))

	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(os.Getenv("RDS_SECRET_NAME")),
	}

	result, err := svc.GetSecretValue(input)
	if err != nil {
		panic(err.Error())
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

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		panic(err.Error())
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

	result, err := db.Exec("USE rds_proxy_go")
	if err != nil {
		fmt.Println("[ERROR]", err)
 		return events.APIGatewayProxyResponse{Body: "Error!", StatusCode: 500}, nil
	}
	fmt.Println(result)

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
