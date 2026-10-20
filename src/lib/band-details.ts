import type { BandRow } from "./db/schema";
import type { BandDetails } from "./domain";

/** The editable part of a band row. */
export function toDetails(band: BandRow): BandDetails {
  return {
    name: band.name,
    contactName: band.contactName,
    contactInfo: band.contactInfo,
    setMin: band.setMin,
    members: band.members,
    inputs: band.inputs,
    monitors: band.monitors,
    stagePlot: band.stagePlot,
    bringing: band.bringing,
    notes: band.notes,
  };
}
