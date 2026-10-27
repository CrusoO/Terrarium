import { create } from "zustand";
import { seedJobs } from "../data/jobs";

let nextId = 200;
const genId = () => `JOB-${++nextId}`;

const useStore = create((set, get) => ({
  jobs: seedJobs(),

  addJob: (jobData) => {
    const job = {
      ...jobData,
      id: genId(),
      created: new Date().toISOString(),
      notes: "",
    };
    set((s) => ({ jobs: [job, ...s.jobs] }));
    return job.id;
  },

  updateJob: (id, patch) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }));
  },

  deleteJob: (id) => {
    set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
  },

  getJob: (id) => get().jobs.find((j) => j.id === id),
}));

export default useStore;
