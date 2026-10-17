// one item for sale (views/pages/listing.ejs)
import { mount } from '../lib/mount';
import LocalDateTime from '../components/common/LocalDateTime';
import LikeButton from '../components/common/LikeButton';
import Comments from '../components/common/Comments';
import PhotoGallery from '../components/market/PhotoGallery';
import SellerActions from '../components/market/SellerActions';

mount({ LocalDateTime, LikeButton, Comments, PhotoGallery, SellerActions });
