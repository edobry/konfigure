package cmd

import (
	"fmt"
	"os"

	"konfigure/konfig"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "konfigure",
	Short: "konfigures K8s workloads",
	Long: `konfigure helps you manage workloads deployed onto K8s,
both application configuration and auxillary resources`,
	SilenceUsage: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		k, err := konfig.ReadKonfig()
		if err != nil {
			fmt.Println("Issue reading konfig!")
			return err
		}

		fmt.Println("Reading konfiguration...")
		fmt.Println(k)
		return nil
	},
}

func init() {

}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		// fmt.Println(err)
		os.Exit(1)
	}
}
