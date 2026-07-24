import React, { useEffect, useState } from "react";

const faqSections = [
  {
id: "fill-attendance",
title: "Fill Attendance",
description:
"Follow steps how to easily fill up your member attendance.",
icon: "📋",

// Add your video here
video: "/videos/fill-attendance.webm",

instructions: [
  "Select Vine.",
  "On the table below, check your member attendance. (Either Onsite or Online)",
  "Click Save all changes to save all your inputs.",
],

},
{
id: "add-members",
title: "Add Members",
description:
"Be guided through the steps on how to add a new member to your vine.",
icon: "👤",

video: "/videos/add-member.webm",

instructions: [
  "On the Selected Vine, fill up the Add New Member form (First Name and Last Name)",
  "Click the Add Member button.",
  "Done.",
  "(Note: The Added Member can be seen on the last page of your list)",
],

},

{
id: "transfer-members",
title: "Transfer Members",
description:
"Learn how to transfer a member from one vine to another.",
icon: "🔄",

image: "/images/transfer-member.png",

instructions: [
"For the meantime, list down the members you want to transfer in the Remarks field below. The admin will be the one to transfer the members.",
"Please follow the format shown in the image above and indicate the vine to which each member will be endorsed.",
"(Note: Do not DELETE the member you want to transfer from your vine list. Do not also try to transfer to another vine by using ADD member.)",
],
},

{
id: "register-member",
title: "Register A Member",
description:
"Learn how to register your member to the main system.",
icon: "🆕",

video: "/videos/register-member.webm",

instructions: [
"Select your Vine",
"Click Open Registration Queue.",
"Click Add Member Details on List.",
"Fill up the form with your member details. Click Add Member when done.",
"(Note: It does not automatically registered after filling up. The admin will be the one to check if the member is registered to the system.)",
],
},
];


export default function FaqButton() {
const [showFaq, setShowFaq] = useState(false);
const [selectedFaq, setSelectedFaq] = useState(null);

useEffect(() => {
const handleKeyDown = (event) => {
if (event.key === "Escape") {
setShowFaq(false);
setSelectedFaq(null);
}
};


if (showFaq) {
  document.addEventListener("keydown", handleKeyDown);
}

return () => {
  document.removeEventListener("keydown", handleKeyDown);
};


}, [showFaq]);

const closeFaq = () => {
setShowFaq(false);
setSelectedFaq(null);
};

return (
<>
{/* FAQ Button */}
<button
type="button"
onClick={() => setShowFaq(true)}
style={{
padding: "10px 20px",
marginLeft: 10,
border: "1px solid var(--border)",
borderRadius: 8,
background: "var(--card)",
color: "var(--foreground)",
fontWeight: 700,
cursor: "pointer",
transition: "all 0.2s ease",
}}
onMouseEnter={(e) => {
e.currentTarget.style.background = "var(--sidebar-active)";
e.currentTarget.style.color = "white";
}}
onMouseLeave={(e) => {
e.currentTarget.style.background = "var(--card)";
e.currentTarget.style.color = "var(--foreground)";
}}
>
❓ FAQs </button>
  {/* FAQ Modal */}
  {showFaq && (
    <div
      role="dialog"
      aria-modal="true"
      onClick={closeFaq}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        padding: 20,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
          animation: "faqModalIn 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            padding: "18px 24px",
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Back Button */}
            {selectedFaq && (
              <button
                type="button"
                onClick={() => setSelectedFaq(null)}
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ←
              </button>
            )}

            <div>
              <h2
                style={{
                  margin: 0,
                  color: "var(--sidebar-active)",
                  fontSize: "clamp(24px, 4vw, 38px)",
                  fontWeight: 800,
                }}
              >
                {selectedFaq
                  ? selectedFaq.title
                  : "Frequently Asked Questions"}
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  opacity: 0.7,
                }}
              >
                {selectedFaq
                  ? "Follow the instructions below."
                  : "Find helpful guides for managing your member attendance."}
              </p>
            </div>
          </div>

          {/* Close Button */}
         <button
              onClick={() => setShowFaq(false)}
              style={{
                fontSize: 18,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
        </div>

        {/* FAQ LIST VIEW */}
        {!selectedFaq && (
          <div
            style={{
              padding: 24,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {faqSections.map((faq) => (
              <div
                key={faq.id}
                onClick={() => setSelectedFaq(faq)}
                className="faqCard"
                style={{
                  padding: 22,
                  minHeight: 150,
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  background:
                    "linear-gradient(145deg, var(--card), var(--background))",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(0, 0, 0, 0.12)";
                  e.currentTarget.style.borderColor =
                    "var(--sidebar-active)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      background: "var(--sidebar-active)",
                      fontSize: 21,
                    }}
                  >
                    {faq.icon}
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {faq.title}
                  </h3>
                </div>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                    fontSize: 14,
                    opacity: 0.75,
                  }}
                >
                  {faq.description}
                </p>

                <div
                  style={{
                    marginTop: 18,
                    fontSize: 13,
                    color: "var(--sidebar-active)",
                    fontWeight: 700,
                  }}
                >
                  View instructions →
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INSTRUCTION VIEW */}
        {selectedFaq && (
  <div
    style={{
      padding: 24,
      animation: "faqContentIn 0.25s ease-out",
    }}
  >
    {/* Instruction Header */}
    <div
      style={{
        padding: 24,
        marginBottom: 24,
        borderRadius: 16,
        background:
          "linear-gradient(135deg, var(--sidebar-active), transparent)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: 42, marginBottom: 10 }}>
        {selectedFaq.icon}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {selectedFaq.title}
      </h3>

      <p
        style={{
          margin: "8px 0 0",
          opacity: 0.75,
        }}
      >
        {selectedFaq.description}
      </p>
    </div>

    {/* Image Container */}
{selectedFaq.image && (
  <div
    style={{
      marginBottom: 24,
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid var(--border)",
      background: "var(--background)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
    }}
  >
    <img
      src={selectedFaq.image}
      alt={selectedFaq.title}
      style={{
        display: "block",
        width: "100%",
        maxHeight: "600px",
        objectFit: "contain",
      }}
    />
  </div>
)}

    {/* Video Container */}
    {selectedFaq.video && (
      <div
        style={{
          marginBottom: 24,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#000",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        }}
      >
        <video
      controls
      preload="metadata"
      style={{
        display: "block",
        width: "100%",
        maxHeight: "600px",
        objectFit: "contain",
      }}
    >
      <source
        src={selectedFaq.video}
        type="video/webm"
      />

      Your browser does not support WebM video.
    </video>
      </div>
    )}

    {/* Steps */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {selectedFaq.instructions.map((instruction, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            padding: 18,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: "var(--background)",
          }}
        >
          <div
            style={{
              minWidth: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "var(--sidebar-active)",
              color: "white",
              fontWeight: 800,
            }}
          >
            {index + 1}
          </div>

          <div
            style={{
              paddingTop: 8,
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {instruction}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </div>
  )}

  <style>
    {`
      @keyframes faqModalIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }

        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes faqContentIn {
        from {
          opacity: 0;
          transform: translateX(15px);
        }

        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `}
  </style>
</>

);
}
