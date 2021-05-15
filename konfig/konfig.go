package konfig

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"sigs.k8s.io/yaml"
)

type Konfiguration struct {
	ApiVersion        string                 `json:"apiVersion"`
	Environment       Environment            `json:"environment"`
	Deployments       map[string]*Deployment `json:"deployments"`
	ExternalResources ExternalResources      `json:"externalResources"`
}

func (konfig Konfiguration) String() string {
	var b strings.Builder

	fmt.Fprintf(&b, "konfiguration %s\n\n", konfig.ApiVersion)

	fmt.Fprint(&b, konfig.Environment.String())
	fmt.Fprintln(&b)

	fmt.Fprintf(&b, "Deployments:\n\n")
	for _, deploy := range konfig.Deployments {
		fmt.Fprintln(&b, deploy)
		fmt.Fprintln(&b)
	}

	fmt.Fprintln(&b)
	// fmt.Fprint(&b, konfig.ExternalResources)

	return b.String()
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

func (env Environment) String() string {
	var b strings.Builder

	fmt.Fprintf(&b, "Initializing DP environment '%s'...\n", env.Name)

	fmt.Fprintf(&b, "Terraform environment: '%s'\n", env.TerraformEnv)
	fmt.Fprintf(&b, "AWS account: '%s'\n", env.AwsAccount)
	fmt.Fprintf(&b, "AWS region: '%s'\n", env.AwsRegion)
	fmt.Fprintf(&b, "K8s context: '%s'\n", env.K8sContext)
	fmt.Fprintf(&b, "K8s namespace: '%s'\n", env.K8sNamespace)

	return b.String()
}

type Deployment struct {
	Name       string
	Chart      string   `json:"chart"`
	Version    string   `json:"version"`
	Source     string   `json:"source"`
	Values     ValueMap `json:"values"`
	Disabled   bool     `json:"disabled"`
	CdDisabled bool     `json:"cdDisabled"`
}

type ValueMap map[string]interface{}

// func (vals ValueMap) String() string {
// 	var b strings.Builder
// 	var valImpl interface{}

// 	for key, val := range vals {
// 		switch e := val.(type) {
// 		case string:
// 			valImpl = e
// 		case map[string]interface{}:
// 			valImpl = ValueMap(e).String()
// 			fmt.Fprintf(&b, "\n\t%v", valImpl)
// 		default:
// 			panic("Unknown event type")
// 		}

// 		fmt.Fprintf(&b, "%v: %v\n", key, valImpl)
// 	}

// 	return b.String()
// }

func (vals ValueMap) String() string {
	var b strings.Builder

	y, err := yaml.Marshal(vals)
	if err != nil {
		fmt.Printf("err: %v\n", err)
		os.Exit(1)
	}

	fmt.Fprintf(&b, "    %v", strings.ReplaceAll(string(y), "\n", "\n  "))

	return b.String()
}

func (deploy Deployment) String() string {
	var b strings.Builder

	fmt.Fprintf(&b, "%s:\n", deploy.Name)

	fmt.Fprintf(&b, "  Chart: %s\n", deploy.Chart)

	val := deploy.Version != ""
		?"":""
	if deploy.Version != "" {
		fmt.Sprintf(":%s %s\n", deploy.Version)
	}
	if deploy.Source != "" {
		fmt.Fprintf(&b, "  Source: %s\n", deploy.Source)
	}

	if deploy.Disabled {
		fmt.Fprintln(&b, "  Disabled")
	}

	if deploy.CdDisabled {
		fmt.Fprintln(&b, "  CD Disabled")
	}

	if len(deploy.Values) > 0 {
		fmt.Fprintln(&b, "  Values:")
		fmt.Fprintln(&b, deploy.Values)
	}

	// fmt.Fprintf(&b, ": '%s'\n", deploy.)

	return b.String()
}

type ExternalResources struct {
	SecretPresets map[string]interface{}       `json:"secretPresets"`
	Deployments   map[string]*ExternalResource `json:"deployments"`
}

type ExternalResource struct {
	Deployment

	Service         map[string]string `json:"service"`
	ExternalSecrets map[string]string `json:"externalSecrets"`
	SecretPreset    string            `json:"$secretPreset"`
}

func ReadKonfig() (Konfiguration, error) {
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

	for name, deploy := range konfig.Deployments {
		// fmt.Println("name:", name)
		deploy.Name = name
		// fmt.Println("deploy:", deploy)
	}

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

	// for name, deploy := range konfig.Deployments {
	// 	fmt.Println("name:", name)
	// 	fmt.Println("deploy:", deploy)
	// }

	return konfig, nil
}

// Initializing DP environment 'prod'...
// Terraform environment: 'dataeng-prod'
// AWS account: 'ca-aws-data-warehouse-prod'
// AWS region: 'eu-central-1'
// K8s context: 'dataeng-prod'
// K8s namespace: 'coin-collection'
