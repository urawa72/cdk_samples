package main

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Book struct {
  gorm.Model
  Name  string
  Price uint
}

func main() {
	dsn := "root:password@tcp(0.0.0.0:3306)/?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	if dbc := db.Exec("CREATE DATABASE IF NOT EXISTS gorm_test"); dbc.Error != nil {
		fmt.Println(dbc.Error)
		return
	}
	if dbc := db.Exec("USE gorm_test"); dbc.Error != nil {
		fmt.Println(dbc.Error)
		return
	}

	if dbc := db.Exec("CREATE TABLE IF NOT EXISTS books (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(200), price INT)"); dbc.Error != nil {
		fmt.Println(dbc.Error)
		return
	}

 	db.AutoMigrate(&Book{})
 	db.Create(&Book{Name: "思い出", Price: 100})
}
