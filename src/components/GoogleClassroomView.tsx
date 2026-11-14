import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Award,
  Share2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId?: string;
  enrollmentCode?: string;
  alternateLink?: string;
  courseState: 'ACTIVE' | 'ARCHIVED';
  teacherName: string;
  colorScheme: {
    bg: string;
    badge: string;
  };
  assignments: {
    id: string;
    title: string;
    dueDate?: string;
    points?: number;
    status: 'assigned' | 'submitted' | 'graded';
    link?: string;
  }[];
  announcements: {
    id: string;
    text: string;
    date: string;
    author: string;
  }[];
}

const SAMPLE_COURSES: ClassroomCourse[] = [
  {
    id: 'course_cse311',
    name: 'CSE 311: Database Management Systems',
    section: 'Section 04 • Fall Semester',
    descriptionHeading: 'Relational Database Design, SQL, Transactions & Normalization',
    room: 'Lab 402, Dept of CSE',
    courseState: 'ACTIVE',
    teacherName: 'Dr. M. Rahman',
    alternateLink: 'https://classroom.google.com',
    colorScheme: {
      bg: 'from-blue-600 to-indigo-700',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    },
    assignments: [
      {
        id: 'asg_1',
        title: 'Assignment 3: SQL Query Optimization & Indexing',
        dueDate: 'Tomorrow, 11:59 PM',
        points: 20,
        status: 'assigned',
      },
      {
        id: 'asg_2',
        title: 'Lab Project: Full-Stack Bandhan Database Schema',
        dueDate: 'Oct 24, 5:00 PM',
        points: 50,
        status: 'assigned',
      },
      {
        id: 'asg_3',
        title: 'Quiz 2: B-Tree Indexes & ACID Transactions',
        dueDate: 'Graded',
        points: 15,
        status: 'graded',
      },
    ],
    announcements: [
      {
        id: 'ann_1',
        text: 'Class will start at 10:30 AM tomorrow in Lab 402. Please review Normalization slides before coming.',
        date: 'Today at 9:15 AM',
        author: 'Dr. M. Rahman',
      },
      {
        id: 'ann_2',
        text: 'Midterm exam marks have been published. Check your grades in the portal.',
        date: '2 days ago',
        author: 'Course TA',
      },
    ],
  },
  {
    id: 'course_mat215',
    name: 'MAT 215: Linear Algebra & Matrix Analysis',
    section: 'Section 02',
    descriptionHeading: 'Vector Spaces, Eigenvalues, SVD & Linear Transformations',
    room: 'Room 310, Academic Building 2',
    courseState: 'ACTIVE',
    teacherName: 'Prof. Farhana Haque',
    alternateLink: 'https://classroom.google.com',
    colorScheme: {
      bg: 'from-emerald-600 to-teal-700',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    assignments: [
      {
        id: 'asg_mat_1',
        title: 'Problem Set 4: Eigenvalues, Diagonalization & SVD',
        dueDate: 'Sunday, 10:00 PM',
        points: 25,
        status: 'assigned',
      },
      {
        id: 'asg_mat_2',
        title: 'Midterm Practice Test Papers (Non-graded)',
        dueDate: 'Completed',
        points: 0,
        status: 'submitted',
      },
    ],
    announcements: [
      {
        id: 'ann_mat_1',
        text: 'Office hours will be held on Thursday from 3:00 PM - 5:00 PM in Room 412.',
        date: 'Yesterday at 4:30 PM',
        author: 'Prof. Farhana Haque',
      },
    ],
  },
  {
    id: 'course_eng101',
    name: 'ENG 101: Critical Reading & Academic Writing',
    section: 'Section 08',
    descriptionHeading: 'Research Papers, Citations, Thesis Formulation & Argumentation',
    room: 'NAC 501',
    courseState: 'ACTIVE',
    teacherName: 'Nasir Uddin',
    alternateLink: 'https://classroom.google.com',
    colorScheme: {
      bg: 'from-purple-600 to-pink-700',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    },
    assignments: [
      {
        id: 'asg_eng_1',
        title: 'Term Paper Draft: Social Media Impact on Youth',
        dueDate: 'Oct 28, 11:59 PM',
        points: 40,
        status: 'assigned',
      },
    ],
    announcements: [
      {
        id: 'ann_eng_1',
        text: 'Peer review session will take place during next Monday’s lecture.',
        date: '3 days ago',
        author: 'Nasir Uddin',
      },
    ],
  },
];

export const GoogleClassroomView: React.FC = () => {
  const { language, driveAccessToken, signInWithGoogleAccount, showToast, addPost } = useApp();
  const [courses, setCourses] = useState<ClassroomCourse[]>(SAMPLE_COURSES);
  const [selectedCourse, setSelectedCourse] = useState<ClassroomCourse | null>(SAMPLE_COURSES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'assignments' | 'announcements'>('all');
  const [newAnnouncementText, setNewAnnouncementText] = useState('');

  // Fetch live courses from Google Classroom API if OAuth access token is available
  useEffect(() => {
    if (!driveAccessToken) return;

    let isMounted = true;
    async function fetchClassroomData() {
      setIsLoading(true);
      try {
        const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
          headers: {
            Authorization: `Bearer ${driveAccessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.courses && Array.isArray(data.courses) && data.courses.length > 0) {
            const mapped: ClassroomCourse[] = data.courses.map((c: any, idx: number) => {
              const colors = [
                { bg: 'from-blue-600 to-indigo-700', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' },
                { bg: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' },
                { bg: 'from-purple-600 to-pink-700', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' },
                { bg: 'from-amber-600 to-orange-700', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' },
              ];
              const color = colors[idx % colors.length];
              return {
                id: c.id,
                name: c.name,
                section: c.section || 'General Section',
                descriptionHeading: c.descriptionHeading || c.description || 'Active Course',
                room: c.room || 'Online Classroom',
                courseState: 'ACTIVE',
                teacherName: c.ownerId ? 'Instructor' : 'Instructor',
                alternateLink: c.alternateLink || `https://classroom.google.com/c/${c.id}`,
                colorScheme: color,
                assignments: [
                  {
                    id: `asg_${c.id}_1`,
                    title: `${c.name} - Ongoing Homework & Reading`,
                    dueDate: 'Weekly Task',
                    points: 10,
                    status: 'assigned',
                  },
                ],
                announcements: [
                  {
                    id: `ann_${c.id}_1`,
                    text: `Welcome to ${c.name}! Course materials and assignments will be posted here.`,
                    date: 'Recent',
                    author: 'Instructor',
                  },
                ],
              };
            });
            setCourses(mapped);
            setSelectedCourse(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Google Classroom fetch notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchClassroomData();
    return () => {
      isMounted = false;
    };
  }, [driveAccessToken]);

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.section && c.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleShareToFeed = (courseName: string, itemTitle: string, dueDate?: string) => {
    addPost({
      content:
        language === 'bn'
          ? `📚 গুগল ক্লাসরুম আপডেট: [${courseName}]\n"${itemTitle}" ${dueDate ? `(জমা দেওয়ার শেষ সময়: ${dueDate})` : ''}\nসহপাঠীরা সবাই প্রস্তুত তো?`
          : `📚 Google Classroom Update: [${courseName}]\n"${itemTitle}" ${dueDate ? `(Due: ${dueDate})` : ''}\nStudy hard and good luck!`,
      privacy: 'public',
    });
    showToast(
      language === 'bn'
        ? 'গুগল ক্লাসরুম অ্যাসাইনমেন্ট বন্ধন ফিডে শেয়ার করা হয়েছে!'
        : 'Classroom assignment shared to Bandhan feed!'
    );
  };

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim() || !selectedCourse) return;

    const newAnn = {
      id: `ann_local_${Date.now()}`,
      text: newAnnouncementText.trim(),
      date: language === 'bn' ? 'এইমাত্র' : 'Just now',
      author: language === 'bn' ? 'আপনি (Student)' : 'You (Student)',
    };

    setCourses((prev) =>
      prev.map((c) =>
        c.id === selectedCourse.id
          ? { ...c, announcements: [newAnn, ...c.announcements] }
          : c
      )
    );

    setSelectedCourse((prev) =>
      prev ? { ...prev, announcements: [newAnn, ...prev.announcements] } : null
    );

    setNewAnnouncementText('');
    showToast(language === 'bn' ? 'ক্লাসরুমে নোটিশ পোস্ট হয়েছে!' : 'Notice posted in classroom!');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'bn' ? 'গুগল ক্লাসরুম' : 'Google Classroom'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'আপনার সকল কোর্স, লেকচার, অ্যাসাইনমেন্ট ও ক্লাসের নোটিশ এক জায়গায়'
                  : 'Manage all your enrolled courses, assignments, lectures & announcements in one place'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!driveAccessToken ? (
              <button
                type="button"
                onClick={signInWithGoogleAccount}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>{language === 'bn' ? 'গুগল একাউন্ট যুক্ত করুন' : 'Connect Google Classroom'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{language === 'bn' ? 'গুগল ক্লাসরুম সিঙ্কড' : 'Classroom Synced'}</span>
              </div>
            )}
            <a
              href="https://classroom.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Open Google Classroom"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Search & filter bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'কোর্স বা বিষয়ের নাম খুঁজুন...' : 'Search courses by name or code...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'সব' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('assignments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterTab === 'assignments'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'অ্যাসাইনমেন্ট' : 'Assignments'}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('announcements')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filterTab === 'announcements'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {language === 'bn' ? 'নোটিশ ও আপডেট' : 'Announcements'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Course List & Course Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Course Cards / Left Column */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            {language === 'bn' ? `আপনার কোর্সসমূহ (${filteredCourses.length})` : `Your Enrolled Courses (${filteredCourses.length})`}
          </h3>

          {filteredCourses.map((course) => {
            const isSelected = selectedCourse?.id === course.id;
            return (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${course.colorScheme.badge}`}>
                      {course.section}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {course.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {course.teacherName} • {course.room}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{course.assignments.length} {language === 'bn' ? 'অ্যাসাইনমেন্ট' : 'Assignments'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{course.announcements.length} {language === 'bn' ? 'নোটিশ' : 'Posts'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Course Stage / Right Column */}
        {selectedCourse && (
          <div className="lg:col-span-7 space-y-4">
            {/* Course Hero Banner */}
            <div className={`rounded-2xl p-6 text-white bg-gradient-to-r ${selectedCourse.colorScheme.bg} shadow-md relative overflow-hidden`}>
              <div className="relative z-10 space-y-2">
                <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
                  {selectedCourse.section}
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{selectedCourse.name}</h3>
                <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
                  {selectedCourse.descriptionHeading}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/80">
                  <span>Instructor: <strong className="text-white">{selectedCourse.teacherName}</strong></span>
                  <span>Location: <strong className="text-white">{selectedCourse.room}</strong></span>
                </div>
              </div>
            </div>

            {/* Post Announcement Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <form onSubmit={handlePostAnnouncement} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'bn' ? 'ক্লাসরুমে কিছু শেয়ার করুন বা প্রশ্ন করুন' : 'Announce something to your class'}</span>
                </div>
                <textarea
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  rows={2}
                  placeholder={
                    language === 'bn'
                      ? 'ক্লাসের সহপাঠী ও শিক্ষকের সাথে তথ্য শেয়ার করুন...'
                      : 'Share with your class, ask questions, or provide updates...'
                  }
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="submit"
                    disabled={!newAnnouncementText.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {language === 'bn' ? 'পোস্ট করুন' : 'Post Announcement'}
                  </button>
                </div>
              </form>
            </div>

            {/* Assignments List */}
            {(filterTab === 'all' || filterTab === 'assignments') && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{language === 'bn' ? 'অ্যাসাইনমেন্ট ও ক্লাসওয়ার্ক' : 'Classwork & Assignments'}</span>
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {selectedCourse.assignments.length} total
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCourse.assignments.map((asg) => (
                    <div
                      key={asg.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                            {asg.title}
                          </h5>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                              <Calendar className="w-3 h-3" />
                              <span>{asg.dueDate}</span>
                            </span>
                            {asg.points !== undefined && (
                              <span>{asg.points} {language === 'bn' ? 'পয়েন্ট' : 'pts'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleShareToFeed(selectedCourse.name, asg.title, asg.dueDate)}
                          title={language === 'bn' ? 'বন্ধন ফিডে শেয়ার করুন' : 'Share to Bandhan Feed'}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <a
                          href={selectedCourse.alternateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors"
                        >
                          {language === 'bn' ? 'জমা দিন' : 'Open'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements List */}
            {(filterTab === 'all' || filterTab === 'announcements') && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ক্লাসের নোটিশ ও আপডেট' : 'Class Announcements'}</span>
                </h4>

                <div className="space-y-3">
                  {selectedCourse.announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {ann.author}
                        </span>
                        <span className="text-[11px] text-slate-400">{ann.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {ann.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
