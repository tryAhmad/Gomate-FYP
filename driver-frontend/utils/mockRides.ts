// eslint-disable-next-line import/no-unresolved
import { RideRequest } from "@/components/RideCard"

export const mockSoloRides: Omit<RideRequest, "distance" | "timeAway">[] = [
  {
    id: "1",
    pickup: "Garhi Shahu, Lahore",
    destination: "Faiz Road 12 (Muslim Town)",
    fare: 250,
    passengerName: "Adil",
    passengerPhone: "923164037719",
    type: "solo",
  },
  {
    id: "2",
    pickup: "Eden Villas",
    destination: "Roundabout, Block M 1 Lake City, Lahore",
    fare: 540,
    passengerName: "Ahmad",
    passengerPhone: "923164037719",
    type: "solo",
  },
  {
    id: "3",
    pickup: "Wapda Town",
    destination: "G1, Johar Town",
    fare: 400,
    passengerName: "Ali",
    passengerPhone: "923164037719",
    type: "solo",
  },
]

export const mockSharedRides: Omit<RideRequest, "distance" | "timeAway">[] = [
  {
    id: "shared-1",
    pickup: [
      "Nargis Block, Allama Iqbal Town, Lahore, Pakistan",
      "Kareem Block, Allama Iqbal Town, Lahore, Pakistan"
    ],
    destination: [
      "Plot-1, C, St. 1, Block C1 Block C 1 Gulberg III, Lahore, 54000, Pakistan",
      "Liberty Market, Gulberg, Lahore, Pakistan"
    ],
    fare: [380, 420],
    passengerName: ["Umer", "Sara"],
    passengerPhone: ["923164037719", "923164037720"],
    type: "shared",
  },
  {
    id: "shared-2",
    pickup: [
      "DHA Phase 5, Lahore, Pakistan",
      "Main Airport Rd, near Divine Gardens, Block B DHA, Lahore, 54792, Pakistan"
    ],
    destination: [
      "16M Abdul Haque Rd, Trade Centre Commercial Area Phase 2 Johar Town, Lahore, 54000, Pakistan",
      "Packages Mall, Lahore, Pakistan"
    ],
    fare: [450, 390],
    passengerName: ["Bilal", "Fatima"],
    passengerPhone: ["923164037721", "923164037722"],
    type: "shared",
  },
];