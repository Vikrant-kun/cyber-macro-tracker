export type FoodEntry = {
  id: string
  name: string
  protein: number
  carbs: number
  fat: number
  createdAt: number
}

export type MacroGoals = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type DayState = {
  dateKey: string
  goals: MacroGoals
  entries: FoodEntry[]
}

