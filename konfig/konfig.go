package konfig

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
)

type Konfiguration struct {
	ApiVersion        string                `json:"apiVersion"`
	Environment       Environment           `json:"environment"`
	Deployments       map[string]Deployment `json:"deployments"`
	ExternalResources ExternalResources     `json:"externalResources"`
}

type Environment struct {
	Name            string
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

func (konfig Konfiguration) String() string {
	var b strings.Builder

	fmt.Fprintf(&b, "Initializing DP environment '%s'...\n", konfig.Environment.Name)

	fmt.Fprintf(&b, "Terraform environment: '%s'\n", konfig.Environment.TerraformEnv)
	fmt.Fprintf(&b, "AWS account: '%s'\n", konfig.Environment.AwsAccount)
	fmt.Fprintf(&b, "AWS region: '%s'\n", konfig.Environment.AwsRegion)
	fmt.Fprintf(&b, "K8s context: '%s'\n", konfig.Environment.K8sContext)
	fmt.Fprintf(&b, "K8s namespace: '%s'\n", konfig.Environment.K8sNamespace)

	return b.String()
}

func ReadKonfig() (Konfiguration, error) {
	fmt.Println("Reading konfiguration...")

	path, err := os.Getwd()
	if err != nil {
		fmt.Println(err)
	}

	konfigFile, err := os.Open(fmt.Sprintf("%s/%s", path, "konfig.json"))
	if err != nil {
		return Konfiguration{}, err
	}

	defer konfigFile.Close()

	bytes, err := ioutil.ReadAll(konfigFile)
	if err != nil {
		return Konfiguration{}, err
	}

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

	konfig.Environment.Name = "dev"

	return konfig, nil
}

// Initializing DP environment 'prod'...
// Terraform environment: 'dataeng-prod'
// AWS account: 'ca-aws-data-warehouse-prod'
// AWS region: 'eu-central-1'
// K8s context: 'dataeng-prod'
// K8s namespace: 'coin-collection'
