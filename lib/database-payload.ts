import type { RegistrationData } from './schema';

export function householdPayload(value: RegistrationData, photoPath?: string) {
  return {
    head_name: value.headName,
    house_name: value.houseName,
    head_age: value.headAge,
    phone: value.phone,
    house_type: value.houseType,
    has_chronic_illness: value.hasChronicIllness === 'yes',
    chronic_details: value.hasChronicIllness === 'yes' ? value.chronicDetails : null,
    receives_aid: value.receivesAid === 'yes',
    aid_details: value.receivesAid === 'yes' ? value.aidDetails : null,
    ...(photoPath ? { photo_path: photoPath } : {}),
  };
}

export function membersPayload(value: RegistrationData) {
  return value.members.map((member, index) => ({
    sl_no: index + 1,
    name: member.name,
    age: member.age === '' ? null : member.age,
    relation: member.relation || null,
    education: member.education || null,
    technical_qualification: member.technicalQualification || null,
    occupation: member.occupation || null,
    blood_group: member.bloodGroup || null,
    phone: member.phone || null,
  }));
}
