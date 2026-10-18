import { SERVICE_PLUGINS } from "./definitions.js";
import { createServicePlugin } from "./entry.js";
export default createServicePlugin(SERVICE_PLUGINS.find(def => def.service === "happyhorse")!);
