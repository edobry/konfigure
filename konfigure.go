package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

func main() {
	fmt.Println("konfigure - v0.1.0")
	fmt.Println("Reading konfiguration...")

	konfigFile, err := os.Open("konfig.json")

	if err != nil {
		fmt.Println(err)
	}

	defer konfigFile.Close()

	bytes, _ := ioutil.ReadAll(konfigFile)

	// println(string(bytes))

	konfig := Konfiguration{}

	json.Unmarshal(bytes, &konfig)

	// fmt.Println(konfig)

	// spew.Dump(konfig)
	// spew.Dump(konfig.ApiVersion)
	// spew.Dump(konfig.Environment)

	// jsonKonfig, _ := json.MarshalIndent(konfig, "", "    ")
	// fmt.Println(string(jsonKonfig))

	// fmt.Println(konfig.ApiVersion)
	// fmt.Println(konfig.Environment)
	// fmt.Println(konfig.Deployments)

	env := "dev"

	fmt.Printf("Initializing DP environment '%s'...\n", env)

	fmt.Printf("Terraform environment: '%s'\n", konfig.Environment.TerraformEnv)
	fmt.Printf("AWS account: '%s'\n", konfig.Environment.AwsAccount)
	fmt.Printf("AWS region: '%s'\n", konfig.Environment.AwsRegion)
	fmt.Printf("K8s context: '%s'\n", konfig.Environment.K8sContext)
	fmt.Printf("K8s namespace: '%s'\n", konfig.Environment.K8sNamespace)

	fmt.Println()
	fmt.Println("Deployments:")
	for key, element := range konfig.Deployments {
		val, _ := json.MarshalIndent(element, "", "    ")
		fmt.Printf("%s: %v\n", key, string(val))
	}
	fmt.Println()
	fmt.Println("External Resources:")
	for key, element := range konfig.ExternalResources.Deployments {
		val, _ := json.MarshalIndent(element, "", "    ")
		fmt.Printf("%s: %v\n", key, string(val))
	}
}

// Initializing DP environment 'prod'...
// Terraform environment: 'dataeng-prod'
// AWS account: 'ca-aws-data-warehouse-prod'
// AWS region: 'eu-central-1'
// K8s context: 'dataeng-prod'
// K8s namespace: 'coin-collection'

type Konfiguration struct {
	ApiVersion        string                `json:"apiVersion"`
	Environment       Environment           `json:"environment"`
	Deployments       map[string]Deployment `json:"deployments"`
	ExternalResources ExternalResources     `json:"externalResources"`
}

type Environment struct {
	TerraformEnv    string `json:"tfEnv"`
	TerraformModule string `json:"tfModule"`
	AwsAccount      string `json:"awsAccount"`
	AwsRegion       string `json:"awsRegion"`
	K8sContext      string `json:"k8sContext"`
	K8sNamespace    string `json:"k8sNamespace"`
	EksNodegroup    string `json:"eksNodegroup"`
}

type Deployment struct {
	Chart      string                 `json:"chart"`
	Version    string                 `json:"version"`
	Source     string                 `json:"source"`
	Values     map[string]interface{} `json:"values"`
	Disabled   bool                   `json:"disabled"`
	CdDisabled bool                   `json:"cdDisabled"`
}

type ExternalResources struct {
	SecretPresets map[string]interface{}      `json:"secretPresets"`
	Deployments   map[string]ExternalResource `json:"deployments"`
}

type ExternalResource struct {
	Deployment

	Service         map[string]string `json:"service"`
	ExternalSecrets map[string]string `json:"externalSecrets"`
	SecretPreset    string            `json:"$secretPreset"`
}
