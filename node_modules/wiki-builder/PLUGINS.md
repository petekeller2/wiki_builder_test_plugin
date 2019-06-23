# List of Plugins
* No known plugins.

# Writing Plugins
* A plugin should be exported as an object.
* That object should contain a function named getStep.
* getStep should return `[[specificFunc, [...extraSpecificArgs]], [[actionOnReducedFunc, [...extraActionArgs]]]]`.
* The specific, reduce and action on reduced functions should all be 
found within the exported object.
* Publish the module to npm so others can use the plugin.
* Edit this file, updating the **List of Plugins**.