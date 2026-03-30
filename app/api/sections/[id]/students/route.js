import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import Section from "@/models/Section";
import { withAuth } from "@/middleware/auth";

export const PUT = withAuth(async (request, { params }) => {
  await connectDB();
  const teacherId = request.teacher.id;
  const sectionId = params.id;
  
  // Verify section belongs to teacher
  const section = await Section.findOne({ _id: sectionId, teacherId });
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  const { studentIds } = await request.json(); // Array of student IDs to be in this section

  if (!Array.isArray(studentIds)) {
    return NextResponse.json({ error: "studentIds must be an array" }, { status: 400 });
  }

  // Find all students for this teacher
  const allStudents = await Student.find({ teacherId });

  // Update logic:
  // For each student, if their ID is in studentIds, ensure sectionId is in their sectionIds.
  // If their ID is not in studentIds, ensure sectionId is removed from their sectionIds.
  
  const bulkOps = allStudents.map((student) => {
    const shouldBeInSection = studentIds.includes(student._id.toString());
    const isInSection = student.sectionIds.map(id => id.toString()).includes(sectionId);

    if (shouldBeInSection && !isInSection) {
      return {
        updateOne: {
          filter: { _id: student._id },
          update: { $push: { sectionIds: sectionId } }
        }
      };
    } else if (!shouldBeInSection && isInSection) {
      return {
        updateOne: {
          filter: { _id: student._id },
          update: { $pull: { sectionIds: sectionId } }
        }
      };
    }
    return null;
  }).filter(Boolean);

  if (bulkOps.length > 0) {
    await Student.bulkWrite(bulkOps);
  }

  return NextResponse.json({ message: "Students updated successfully" });
});
