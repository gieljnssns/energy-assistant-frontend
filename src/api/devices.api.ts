//import axios, { AxiosInstance} from "axios"
import { Device, HeatpumpDevice, Energy, HomePower } from "./device";
import { io, Socket } from "socket.io-client";
import { reactive } from "vue";

export default class DevicesAPIService {
    // private axiosInstance: AxiosInstance;
    private socket?: Socket;
    public baseUrl?: string;
    public home = reactive({
        name: "",
        home_consumption: 0.0,
        power: {
            solar_production: 0.0,
            grid_supply: 0.0,
            solar_self_consumption: 0.0,
            home_consumption: 0.0,
            self_sufficiency: 0.0,
        } as HomePower,
        overall: {
            consumed_solar_energy: 0.0,
            consumed_energy: 0.0,
            self_sufficiency: 0.0
        } as Energy,
        today: {
            consumed_solar_energy: 0.0,
            consumed_energy: 0.0,
            self_sufficiency: 0.0
        } as Energy,
        devices: [] as Device[],
        heat_pumps: [] as HeatpumpDevice[],
    });
    public state = reactive({
        connected: false
    });


    constructor() {
    }

    public initialize(baseUrl: string) {
        if (this.socket) throw "already initialized";
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
        this.baseUrl = baseUrl;
        let pathname = new URL(baseUrl).pathname;
        if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
        const sio_path = pathname + "/ws/socket.io/"
        // const wsUrl = baseUrl.replace("http", "ws");
        console.log(`Connecting to Energy Assistant WS API path ${sio_path}`);

        const devMode = process.env.NODE_ENV === 'development';
        const sio_url = devMode ? "ws://localhost:5000" : "";

        //console.log("window.location: " + window.location.href);
        //console.log("Window parent location: " + window.parent.location);
        //console.log("sio path: " + sio_path);

        //const sio_path = "/ws/socket.io/"
        this.socket = io(sio_url, { path: sio_path, transports: ['websocket', 'polling'] });


        this.socket.on('connect', () => {
            console.log("WS connected...");
            this.state.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log("WS diconnected...");
            this.state.connected = false;
        });

        this.socket.on('connection', (msg, cb) => {
            console.log('Received connection home: ' + msg.data);
            if (cb)
                cb();
            this.update_home(msg.data)
        });

        // Event handler for server sent data.
        // The callback function is invoked whenever the server emits data
        // to the client. The data is then displayed in the "Received"
        // section of the page.
        this.socket.on('refresh', (msg, cb) => {
            console.log('Received refresh home: ' + msg.data);
            if (cb)
                cb();
            this.update_home(msg.data)
        });
    }

    update_home(data: string) {
        const home = JSON.parse(data);
        this.home.name = home.name;
        this.home.power = home.power;
        this.home.overall = home.overall;
        this.home.today = home.today;
        this.home.devices = home.devices;
        this.home.heat_pumps = home.heat_pumps;
    }

}

export const devicesAPI = new DevicesAPIService();