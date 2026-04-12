export type RoutineItemType = 'timed' | 'reps' | 'breaths';
export type RoutineSide = 'both' | 'left' | 'right' | 'none';

export interface RoutineItem {
  id: string;
  name: string;
  type: RoutineItemType;
  durationSec?: number;
  repetitions?: number;
  breaths?: number;
  holdSec?: number;
  sides: RoutineSide;
  instructions: string[];
  cues?: string[];
}

export interface RoutineSection {
  id: string;
  title: string;
  items: RoutineItem[];
}

export interface RoutineDefinition {
  routineId: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  estimatedDurationMin: number;
  tags: string[];
  sections: RoutineSection[];
}

export const quickResetItemIds = [
  'plantar_ball_roll',
  'calf_wall_bent',
  'half_kneeling_hip_flexor',
  'cat_cow',
  'chin_tucks',
  'jaw_relaxation',
] as const;

export const dailyMobilityRoutine: RoutineDefinition = {
  routineId: 'daily_mobility_feet_hips_back_neck_jaw_v1',
  name: 'Daily Reset for Feet, Hips, Back, Neck, and Jaw',
  description:
    'Quick reference guide for calves, plantar fascia, hips, groin, low back, neck, traps, and jaw tension from desk posture.',
  frequency: 'daily',
  estimatedDurationMin: 18,
  tags: ['mobility', 'stretching', 'calves', 'low-back', 'neck', 'groin', 'desk-posture', 'tmj'],
  sections: [
    {
      id: 'feet_calves',
      title: 'Feet and Calves',
      items: [
        {
          id: 'plantar_ball_roll',
          name: 'Plantar Fascia Ball Roll',
          type: 'timed',
          durationSec: 60,
          sides: 'both',
          instructions: [
            'Place a ball under the arch of the foot.',
            'Roll slowly from heel to forefoot.',
            'Pause on tender spots for 5 to 10 seconds.',
          ],
          cues: ['Slow and controlled', 'Moderate pressure'],
        },
        {
          id: 'calf_wall_straight',
          name: 'Straight-Leg Wall Calf Stretch',
          type: 'timed',
          durationSec: 45,
          sides: 'both',
          instructions: [
            'Stand facing a wall.',
            'Place one leg back with the knee straight and heel down.',
            'Lean forward until you feel the stretch in the upper calf.',
          ],
          cues: ['Heel stays down'],
        },
        {
          id: 'calf_wall_bent',
          name: 'Bent-Knee Calf Stretch',
          type: 'timed',
          durationSec: 45,
          sides: 'both',
          instructions: [
            'Use the same wall setup as the straight-leg calf stretch.',
            'Slightly bend the back knee while keeping the heel down.',
            'Lean forward until you feel the stretch lower in the calf or Achilles area.',
          ],
          cues: ['Heel stays down'],
        },
        {
          id: 'toe_plantar_stretch',
          name: 'Toe or Plantar Fascia Stretch',
          type: 'timed',
          durationSec: 30,
          sides: 'both',
          instructions: [
            'Sit and gently pull toes back toward the shin, or do a kneeling toe tuck stretch if comfortable.',
            'Stop before sharp pain.',
          ],
        },
      ],
    },
    {
      id: 'hips_groin',
      title: 'Hips and Groin',
      items: [
        {
          id: 'half_kneeling_hip_flexor',
          name: 'Half-Kneeling Hip Flexor Stretch',
          type: 'timed',
          durationSec: 45,
          sides: 'both',
          instructions: [
            'Kneel on one knee with the other foot in front.',
            'Tuck the pelvis slightly and squeeze the glute on the kneeling side.',
            'Shift the hips forward a small amount until you feel the stretch in front of the hip.',
          ],
          cues: ['Do not arch the low back'],
        },
        {
          id: 'butterfly_stretch',
          name: 'Butterfly Stretch',
          type: 'timed',
          durationSec: 60,
          sides: 'none',
          instructions: [
            'Sit tall with the soles of the feet together.',
            'Let the knees fall outward.',
            'Gently lean forward if comfortable.',
          ],
        },
        {
          id: 'hip_90_90',
          name: '90-90 Hip Stretch',
          type: 'timed',
          durationSec: 45,
          sides: 'both',
          instructions: [
            'Sit with one leg in front at 90 degrees and the other behind at 90 degrees.',
            'Lean slightly forward over the front shin.',
          ],
        },
        {
          id: 'adductor_rockback',
          name: 'Adductor Rock-Back',
          type: 'reps',
          repetitions: 8,
          sides: 'both',
          instructions: [
            'Start on hands and knees.',
            'Extend one leg out to the side with the foot flat.',
            'Rock the hips back slowly, then return to start.',
          ],
        },
      ],
    },
    {
      id: 'back_spine',
      title: 'Back and Spine',
      items: [
        {
          id: 'cat_cow',
          name: 'Cat-Cow',
          type: 'reps',
          repetitions: 10,
          sides: 'none',
          instructions: [
            'Start on hands and knees.',
            'Round the back up slowly, then gently arch and lift the chest.',
            'Move with breathing.',
          ],
        },
        {
          id: 'childs_pose',
          name: "Child's Pose",
          type: 'timed',
          durationSec: 60,
          sides: 'none',
          instructions: [
            'From hands and knees, sit the hips back toward the heels.',
            'Reach the arms forward and breathe into the upper and lower back.',
          ],
        },
        {
          id: 'prone_pressup',
          name: 'Prone Press-Up',
          type: 'reps',
          repetitions: 8,
          holdSec: 2,
          sides: 'none',
          instructions: [
            'Lie face down with hands under the shoulders.',
            'Press the chest up gently while the hips stay down.',
            'Only go into a comfortable range.',
          ],
        },
        {
          id: 'thoracic_extension',
          name: 'Thoracic Extension Over Chair or Roller',
          type: 'reps',
          repetitions: 10,
          sides: 'none',
          instructions: [
            'Support the upper back on a chair edge or foam roller.',
            'Gently extend the upper spine and return to neutral.',
          ],
          cues: ['Do not crank the neck'],
        },
      ],
    },
    {
      id: 'neck_traps_jaw',
      title: 'Neck, Traps, and Jaw',
      items: [
        {
          id: 'chin_tucks',
          name: 'Chin Tucks',
          type: 'reps',
          repetitions: 10,
          holdSec: 5,
          sides: 'none',
          instructions: [
            'Sit or stand tall.',
            'Pull the head straight back as if making a double chin.',
            'Do not tilt the head up or down.',
          ],
        },
        {
          id: 'upper_trap_stretch',
          name: 'Upper Trap Stretch',
          type: 'timed',
          durationSec: 30,
          sides: 'both',
          instructions: [
            'Sit tall.',
            'Gently bring one ear toward the same-side shoulder.',
            'Use light hand pressure only if needed.',
          ],
        },
        {
          id: 'levator_scap_stretch',
          name: 'Levator Scap Stretch',
          type: 'timed',
          durationSec: 30,
          sides: 'both',
          instructions: [
            'Turn the head about 45 degrees.',
            'Look down toward the armpit.',
            'Use light pressure to deepen the stretch if needed.',
          ],
        },
        {
          id: 'jaw_relaxation',
          name: 'Jaw Relaxation Drill',
          type: 'breaths',
          breaths: 5,
          sides: 'none',
          instructions: [
            'Place the tongue lightly on the roof of the mouth behind the front teeth.',
            'Keep the lips together and the teeth slightly apart.',
            'Take slow nasal breaths.',
          ],
        },
        {
          id: 'masseter_self_massage',
          name: 'Masseter Self-Massage',
          type: 'timed',
          durationSec: 30,
          sides: 'both',
          instructions: [
            'Place the fingers over the jaw muscle at the sides of the cheeks.',
            'Use gentle circular pressure.',
            'Avoid pressing directly into the joint itself.',
          ],
        },
      ],
    },
  ],
};

export function formatMobilityTarget(item: RoutineItem) {
  const sideLabel =
    item.sides === 'both'
      ? ' each side'
      : item.sides === 'left' || item.sides === 'right'
        ? ` ${item.sides} side`
        : '';

  if (item.type === 'timed') {
    return `${item.durationSec ?? 0} sec${sideLabel}`;
  }

  if (item.type === 'breaths') {
    return `${item.breaths ?? 0} breaths`;
  }

  const holdLabel = item.holdSec ? ` with ${item.holdSec}s hold` : '';
  return `${item.repetitions ?? 0} reps${sideLabel}${holdLabel}`;
}
