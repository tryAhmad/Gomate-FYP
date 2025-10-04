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
    pickup: ["Nargis Block, Allama Iqbal Town", "Kareem Block"],
    destination: ["Gulberg III, Lahore", "Liberty Market, Gulberg"],
    fare: [380, 420],
    passengerName: ["Umer", "Sara"],
    passengerPhone: ["923164037719", "923164037720"],
    type: "shared",
  },
  {
    id: "shared-2",
    pickup: ["DHA Phase 5", "DHA Phase 6"],
    destination: ["Emporium Mall", "Packages Mall"],
    fare: [450, 390],
    passengerName: ["Bilal", "Fatima"],
    passengerPhone: ["923164037721", "923164037722"],
    type: "shared",
  },
  {
    id: "shared-3",
    pickup: ["Bahria Town Entrance", "Bahria Town Central"],
    destination: ["Lahore Airport", "Railway Station"],
    fare: [680, 750],
    passengerName: ["Zain", "Ayesha"],
    passengerPhone: ["923164037723", "923164037724"],
    type: "shared",
  },
  {
    id: "shared-4",
    pickup: ["University of Lahore", "FC College"],
    destination: ["Model Town", "Garden Town"],
    fare: [320, 280],
    passengerName: ["Hassan", "Mariam"],
    passengerPhone: ["923164037725", "923164037726"],
    type: "shared",
  },
]