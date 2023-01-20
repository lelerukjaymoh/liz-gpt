
class Utils {
    constructor() { }

    async wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

}

export const utils = new Utils()