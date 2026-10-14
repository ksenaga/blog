import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{ mt: 10, py: 5, borderTop: 1, borderColor: "divider", textAlign: "center" }}
    >
      <Container maxWidth="lg">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {SITE_NAME}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {SITE_DESCRIPTION}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 2 }}>
          © {new Date().getFullYear()} {SITE_NAME}
        </Typography>
      </Container>
    </Box>
  );
}
