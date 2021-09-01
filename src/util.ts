export function processInstances(instances: string[]) {
    if(instances[0] == "all") {
        console.log("processing all instances")
        if(instances.length > 1)
            console.warn("Additional instances specified after 'all' keyword, will be ignored.")
    } else
        console.log(`instances: ${instances.join(', ')}`);
}
